import { promises as fs } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "rsvp.json");
const clean = (v, max) => String(v ?? "").trim().slice(0, max);

async function load() {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return [];
  }
}

// Responses are stored in data/rsvp.json (guest names stay private: there is no public GET).
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const name = clean(body?.name, 80);
  if (!name) return Response.json({ error: "Vui lòng nhập tên" }, { status: 400 });
  const entry = {
    name,
    relation: clean(body?.relation, 80),
    message: clean(body?.message, 500),
    attending: !!body?.attending,
    at: new Date().toISOString(),
  };
  const items = await load();
  items.push(entry);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(items, null, 2));
  return Response.json({ ok: true }, { status: 201 });
}
