import nodemailer from "nodemailer";
import { JWT } from "google-auth-library";

const clean = (v, max) => String(v ?? "").trim().slice(0, max);
const SIDES = {
  groom: { label: "Nhà trai", to: () => process.env.MAIL_TO_GROOM },
  bride: { label: "Nhà gái", to: () => process.env.MAIL_TO_BRIDE },
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Appends one row to the "RSVP" tab: time, side, name, relation, attending, message.
async function appendToSheet(entry, sideLabel) {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/RSVP!A:F:append?valueInputOption=USER_ENTERED`;
  const res = await auth.request({
    url,
    method: "POST",
    data: { values: [[entry.at, sideLabel, entry.name, entry.relation, entry.attending ? "Có" : "Không", entry.message]] },
  });
  return res.status;
}

async function sendMail(entry, side) {
  const to = side.to();
  if (!to) throw new Error("missing mail recipient");
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `[${side.label}] ${entry.name} - ${entry.attending ? "Có tham dự" : "Không tham dự"}`,
    html: `<p><b>${esc(entry.name)}</b> (${esc(entry.relation)})</p>
<p>${entry.attending ? "Có tham dự" : "Không tham dự"}</p>
<p>${esc(entry.message).replace(/\n/g, "<br>")}</p>`,
  });
}

// No public GET: guest names stay private. Sheet + mail are independent; the request
// only fails if both do.
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const name = clean(body?.name, 80);
  if (!name) return Response.json({ error: "Vui lòng nhập tên" }, { status: 400 });
  const side = SIDES[body?.side] ?? SIDES.groom;
  const entry = {
    name,
    relation: clean(body?.relation, 80),
    message: clean(body?.message, 500),
    attending: !!body?.attending,
    at: new Date().toISOString(),
  };
  const results = await Promise.allSettled([appendToSheet(entry, side.label), sendMail(entry, side)]);
  results.forEach((r) => r.status === "rejected" && console.error("rsvp:", r.reason));
  if (results.every((r) => r.status === "rejected")) {
    return Response.json({ error: "Không gửi được, vui lòng thử lại" }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
