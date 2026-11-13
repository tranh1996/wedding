import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { JWT } from "google-auth-library";

const clean = (v, max) => String(v ?? "").trim().slice(0, max);
const SIDES = {
  groom: { label: "Nhà trai", to: () => process.env.MAIL_TO_GROOM },
  bride: { label: "Nhà gái", to: () => process.env.MAIL_TO_BRIDE },
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Appends one row to the "RSVP" tab: time, side, name, attending, transport, arrives Friday, message.
async function appendToSheet(entry, sideLabel) {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/RSVP!A:G:append?valueInputOption=USER_ENTERED`;
  const res = await auth.request({
    url,
    method: "POST",
    data: { values: [[entry.at, sideLabel, entry.name, entry.attending ? "Có" : "Không", entry.transport, entry.friday, entry.message]] },
  });
  return res.status;
}

// Local backup: every reply is also appended to data/rsvp.json (git-ignored).
// Only persists on a long-running server (next start); serverless hosts drop it on redeploy.
const RSVP_FILE = path.join(process.cwd(), "data", "rsvp.json");
let fileQueue = Promise.resolve(); // serialise writes so two submits never overwrite each other

function appendToFile(entry, sideLabel) {
  const run = async () => {
    let items = [];
    try {
      items = JSON.parse(await fs.readFile(RSVP_FILE, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e; // never overwrite a file we failed to parse
    }
    items.push({ ...entry, side: sideLabel });
    await fs.mkdir(path.dirname(RSVP_FILE), { recursive: true });
    await fs.writeFile(RSVP_FILE, JSON.stringify(items, null, 2));
  };
  fileQueue = fileQueue.then(run, run);
  return fileQueue;
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
    html: `<p><b>${esc(entry.name)}</b></p>
<p>${entry.attending ? "Có tham dự" : "Không tham dự"}</p>
<p>Di chuyển: ${esc(entry.transport) || "—"}</p>
<p>Về trước 1 ngày (thứ 6): ${esc(entry.friday) || "—"}</p>
<p>${esc(entry.message).replace(/\n/g, "<br>")}</p>`,
  });
}

// No public GET: guest names stay private. File, sheet and mail are independent; the
// request only fails if all three do.
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const name = clean(body?.name, 80);
  if (!name) return Response.json({ error: "Vui lòng nhập tên" }, { status: 400 });
  const side = SIDES[body?.side] ?? SIDES.groom;
  const entry = {
    name,
    transport: clean(body?.transport, 80),
    friday: clean(body?.friday, 80),
    message: clean(body?.message, 500),
    attending: !!body?.attending,
    at: new Date().toISOString(),
  };
  const results = await Promise.allSettled([
    appendToFile(entry, side.label),
    appendToSheet(entry, side.label),
    sendMail(entry, side),
  ]);
  results.forEach((r) => r.status === "rejected" && console.error("rsvp:", r.reason));
  if (results.every((r) => r.status === "rejected")) {
    return Response.json({ error: "Không gửi được, vui lòng thử lại" }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
