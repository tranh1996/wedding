// Converts scripts/source/page.html (a saved Webcake page) into:
//   lib/tree.json      DOM tree of the sections and popups
//   lib/assets.json    asset paths used by the interactive widgets
//   app/template.css   the page CSS with asset URLs pointed at /images and /fonts
//   public/images/*    placeholder images (one per original image slot)
//   public/fonts/*     the fonts used by the page
// Run with: npm run extract
import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "scripts/source/page.html"), "utf8");

const ASSET_RE = /https:\/\/(?:content|statics)\.pancake\.vn\/[^"'\s)]+/g;
const slots = new Map();

function slotFor(url, owner) {
  const key = url.match(/[0-9a-f]{56}/)?.[0] ?? url;
  let slot = slots.get(key);
  if (!slot) {
    const dims = url.match(/w:(\d+)-h:(\d+)/);
    let w = dims ? +dims[1] : 0;
    let h = dims ? +dims[2] : 0;
    if (!w || !h) [w, h] = [400, 400];
    const n = String(slots.size + 1).padStart(2, "0");
    slot = { n, file: `slot-${n}.png`, w, h, owners: new Set() };
    slots.set(key, slot);
  }
  slot.owners.add(owner);
  return `/images/${slot.file}`;
}

function rewriteAssets(text, ownerOf) {
  return text.replace(ASSET_RE, (url, offset) => {
    if (url.includes("audio/mpeg")) return "/music.mp3";
    return slotFor(url, ownerOf(text, offset));
  });
}

const ownerFromCss = (text, offset) => {
  const before = text.slice(0, offset);
  const ids = [...before.matchAll(/#(w-[\w]+)/g)];
  return ids.length ? ids[ids.length - 1][1] : "css";
};

// ---------- CSS ----------
const styles = [...html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map((m) => ({ attrs: m[1], css: m[2] }));
const fontCss = styles.find((s) => s.css.includes("@font-face"));
const fontNames = [];
const fontRules = [...fontCss.css.matchAll(/@font-face\{font-family: "([^"]+)"; src: url\("([^"]+)"\)[^}]*\}/g)];
for (const m of fontRules) fontNames.push({ name: m[1], url: m[2] });

const cssParts = [];
for (const s of styles) {
  if (s === fontCss) continue;
  let css = rewriteAssets(s.css, ownerFromCss);
  const media = s.attrs.match(/media="([^"]+)"/)?.[1];
  if (media) css = `@media ${media} {\n${css}\n}`;
  cssParts.push(css);
}
const fontFaces = fontNames
  .map((f) => `@font-face{font-family:"${f.name}";src:url("/fonts/${f.name}");font-display:swap;}`)
  .join("\n");

// @import rules must come first in a stylesheet
const body = cssParts.join("\n");
const imports = [...body.matchAll(/@import url\([^)]*\);/g)].map((m) => m[0]);
const css = `${[...new Set(imports)].join("\n")}\n${fontFaces}\n${body.replace(/@import url\([^)]*\);/g, "")}`;
fs.writeFileSync(path.join(root, "app/template.css"), css);

// ---------- fonts ----------
for (const f of fontNames) {
  const dest = path.join(root, "public/fonts", f.name);
  if (fs.existsSync(dest)) continue;
  const res = await fetch(f.url);
  if (!res.ok) {
    console.warn("font failed", f.name, res.status);
    continue;
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// ---------- tree ----------
const doc = parse(html, { comment: false, blockTextElements: { script: true, style: true } });
const SKIP_CHILDREN = new Set(["w-0dyp082l", "w-wauub97c", "w-niirgp9l"]); // html boxes replaced by React widgets

const BOOLEAN_ATTRS = new Set(["required", "disabled", "selected", "allowfullscreen", "formnovalidate", "loop", "checked"]);
const ATTR_MAP = { class: "className", for: "htmlFor", allowfullscreen: "allowFullScreen", referrerpolicy: "referrerPolicy", formnovalidate: "formNoValidate", maxlength: "maxLength", tabindex: "tabIndex" };

function toNode(el) {
  if (el.nodeType === 3) {
    const text = el.text; // decoded entities
    return text.trim() === "" && text.includes("\n") ? null : text;
  }
  if (el.nodeType !== 1) return null;
  const tag = el.rawTagName.toLowerCase();
  if (tag === "script" || tag === "style") return null;

  const attrs = {};
  for (const [k, v] of Object.entries(el.attributes)) {
    if (k === "style") {
      attrs.style = v;
      continue;
    }
    const key = ATTR_MAP[k] ?? k;
    attrs[key] = v === "" && BOOLEAN_ATTRS.has(k) ? true : rewriteAssets(v, () => el.id || "markup");
  }
  if (attrs.className) {
    attrs.className = attrs.className.split(/\s+/).filter((c) => c && c !== "lazy").join(" ");
  }
  const node = { t: tag, a: attrs };
  if (!SKIP_CHILDREN.has(el.id)) {
    const kids = el.childNodes.map(toNode).filter((n) => n !== null);
    if (kids.length) node.c = kids;
  }
  return node;
}

const tops = [...doc.querySelectorAll("[data-section], .com-popup, #popup-backdrop")];
const tree = tops.map(toNode);
fs.writeFileSync(path.join(root, "lib/tree.json"), JSON.stringify(tree));

// ---------- assets used by hand-written widgets ----------
const box = doc.querySelectorAll(".frame-html-box")[1].innerHTML;
const icons = [...box.matchAll(/id="(play|pause)-icon"\s+src="([^"]+)"/g)];
const heart = html.match(/HEART_SRC =\s*"([^"]+)"/)[1];
const assets = {
  music: "/music.mp3",
  playIcon: slotFor(icons.find((m) => m[1] === "play")[2], "music-play"),
  pauseIcon: slotFor(icons.find((m) => m[1] === "pause")[2], "music-pause"),
  heart: slotFor(heart, "calendar-heart"),
};
fs.writeFileSync(path.join(root, "lib/assets.json"), JSON.stringify(assets, null, 2));

// ---------- placeholder images ----------
fs.mkdirSync(path.join(root, "public/images"), { recursive: true });
const readme = ["Image slots. Replace each file with your own image (keep the file name).", ""];
for (const s of slots.values()) {
  const dest = path.join(root, "public/images", s.file);
  readme.push(`${s.file}  original ${s.w}x${s.h}  used by: ${[...s.owners].join(", ")}`);
  if (fs.existsSync(dest)) continue; // never overwrite images you already replaced
  const scale = Math.min(1, 600 / Math.max(s.w, s.h));
  const w = Math.max(8, Math.round(s.w * scale));
  const h = Math.max(8, Math.round(s.h * scale));
  const size = Math.max(10, Math.min(w, h) / 6);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="#7ba7dd" fill-opacity=".2" stroke="#2f5d9e" stroke-dasharray="6 4"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${size}" fill="#2f5d9e">${s.n}</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(dest);
}
fs.writeFileSync(path.join(root, "public/images/README.txt"), readme.join("\n") + "\n");

console.log(`sections/popups: ${tree.length}, image slots: ${slots.size}, fonts: ${fontNames.length}`);
