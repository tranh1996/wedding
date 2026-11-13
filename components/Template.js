"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import tree from "@/lib/tree.json";
import Calendar from "./Calendar";
import MusicToggle from "./MusicToggle";

const VOID = new Set(["br", "img", "input", "hr"]);
const GIFT_POPUP = "w-2czgudf9";
const UNDECIDED = "Chưa chốt được";
// Map query baked into lib/tree.json; swapped for content.mapQuery at render.
const MAP_QUERY = "Th%C3%B4n%20V%C3%B4%20Song%2C%20B%E1%BA%AFc%20%C4%90%C3%B4ng%20Quan%2C%20H%C6%B0ng%20Y%C3%AAn";
const THANKS_POPUP = "w-__popup_default__";
const ATTENDING_YES = "Có Tham Dự";
// Album at the bottom: photos in /public/images/album/01..N.jpg are shuffled into these
// slots on every page load. Add more photos and bump ALBUM_COUNT to widen the pool.
const ALBUM_COUNT = 7;
// The first (full-width) album slot w-hiz4kjo9 always shows album/04.jpg (set in template.css);
// that photo is left out of the shuffle so it never repeats.
const ALBUM_FIXED = 4;
const ALBUM_SLOTS = ["w-1fom54h6", "w-d83g3hhq", "w-mdl4wa9d", "w-e8h3vgem", "w-ifbchb12"];

function parseStyle(css) {
  const out = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const key = decl.slice(0, i).trim();
    out[key.startsWith("--") ? key : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return out;
}

function countdownParts(target, now) {
  const diff = Math.max(0, new Date(target).getTime() - now);
  const two = (n) => String(n).padStart(2, "0");
  return {
    day: two(Math.floor(diff / 864e5)),
    hour: two(Math.floor(diff / 36e5) % 24),
    minute: two(Math.floor(diff / 6e4) % 60),
    second: two(Math.floor(diff / 1e3) % 60),
  };
}

function props(node, extra = {}) {
  const { style, ...rest } = node.a;
  const { style: extraStyle, ...extraRest } = extra;
  const p = { ...rest, ...extraRest };
  if (typeof style === "string" && style.trim()) p.style = { ...parseStyle(style), ...extraStyle };
  else if (extraStyle) p.style = extraStyle;
  return p;
}

function Countdown({ node, ctx }) {
  const { content } = ctx;
  const [parts, setParts] = useState(() => countdownParts(content.weddingDate, new Date(content.weddingDate).getTime()));
  useEffect(() => {
    const tick = () => setParts(countdownParts(content.weddingDate, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div {...props(node)}>{(node.c ?? []).map((c, i) => render(c, i, { ...ctx, countdown: parts }))}</div>;
}

// ctx: { content, owner, popup, setPopup, onSubmit, countdown }
function render(node, key, ctx) {
  if (typeof node === "string") return node;
  const { t: Tag, a, c } = node;
  const id = a.id;
  const cls = a.className ?? "";

  if (id === "w-0dyp082l") return <div key={key} {...props(node)}><div className="frame-html-box full-width full-height"><MusicToggle /></div></div>;
  if (id === "w-niirgp9l") return <div key={key} {...props(node)}><div className="frame-html-box full-width full-height"><Calendar content={ctx.content} /></div></div>;
  if (cls.includes("com-countdown")) return <Countdown key={key} node={node} ctx={ctx} />;

  const extra = {};
  let kids = c;

  // popups are shown by dropping d-none
  if (id === THANKS_POPUP || id === GIFT_POPUP) {
    extra.className = ctx.popup === id ? cls.replace("d-none", "").trim() : cls;
  }
  if (id === "popup-backdrop") {
    extra.className = ctx.popup ? cls.replace("d-none", "").trim() : cls;
    extra.onClick = () => ctx.setPopup(null);
  }

  // click targets
  if (id === "w-noyvu32w") extra.onClick = () => ctx.setPopup(GIFT_POPUP); // "Gửi mừng cưới" group
  if (id === "w-mcd6y7dt" || id === "w-au0o7yap") extra.onClick = () => ctx.setPopup(null); // popup close rectangles
  if (id === "w-i72hlok0") extra.onClick = (e) => e.currentTarget.closest("form").requestSubmit();
  if (Tag === "form") extra.onSubmit = ctx.onSubmit;
  if (Tag === "select") extra.defaultValue = "";
  // transport + friday selects get an extra "not decided yet" answer
  if (Tag === "select" && (a.name === "transport" || a.name === "friday")) {
    kids = [...c, { t: "option", a: { value: UNDECIDED }, c: [UNDECIDED] }];
  }
  // "Bạn có tham dự không?": transport + "về từ thứ 6" selects only show after "Có Tham Dự"
  if (Tag === "select" && node.a.name === "select_1") extra.onChange = (e) => ctx.setAttending(e.target.value === ATTENDING_YES);

  // text replaced from lib/content.js
  let owner = ctx.owner;
  if (cls.includes("com-text-block")) owner = id;
  if (cls.includes("text-block-css") && ctx.content.texts[owner] !== undefined) {
    kids = [ctx.content.texts[owner]];
    extra.style = { whiteSpace: "pre-line" };
  }

  // countdown numbers
  const unit = cls.match(/countdown-item-(day|hour|minute|second)/)?.[1];
  if (unit && ctx.countdown && c) kids = [{ ...c[0], c: [ctx.countdown[unit]] }, ...c.slice(1)];

  const p = props(node, extra);
  for (const k of ["src", "href", "title"]) {
    if (typeof p[k] === "string" && p[k].includes(MAP_QUERY)) p[k] = p[k].replace(MAP_QUERY, encodeURIComponent(ctx.content.mapQuery));
  }
  if (Tag === "option") delete p.selected;
  if (Tag === "option" && p.value === "Đi xe của chú rể thuê" && ctx.content.carOption) {
    p.value = ctx.content.carOption;
    kids = [ctx.content.carOption];
  }
  const childCtx = { ...ctx, owner };
  if (VOID.has(Tag)) return <Tag key={key} {...p} />;
  return <Tag key={key} {...p}>{(kids ?? []).map((k, i) => render(k, i, childCtx))}</Tag>;
}

export default function Template({ content }) {
  const [popup, setPopup] = useState(null);
  const [attending, setAttending] = useState(false);
  const root = useRef(null);

  // Scroll-triggered animations: add .animation when an .is-animation element enters the viewport.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("animation");
        io.unobserve(e.target);
      }
    }, { threshold: 0.15 });
    root.current.querySelectorAll(".is-animation").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Gift popup QR: image comes from content.qrImage (per family).
  useEffect(() => {
    const el = root.current.querySelector("#w-ynp4k50a .image-background");
    if (el && content.qrImage) el.style.backgroundImage = `url(${content.qrImage})`;
  }, [content.qrImage]);

  // Random album: give each slot a different photo from the pool.
  useEffect(() => {
    const pool = Array.from({ length: ALBUM_COUNT }, (_, i) => i + 1).filter((n) => n !== ALBUM_FIXED);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    ALBUM_SLOTS.forEach((id, i) => {
      const el = root.current.querySelector("#" + id + " .image-background");
      if (el) el.style.backgroundImage = `url(/images/album/${String(pool[i]).padStart(2, "0")}.jpg)`;
    });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const yes = data.get("select_1") === ATTENDING_YES;
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("full_name"),
        transport: yes ? data.get("transport") : "",
        friday: yes ? data.get("friday") : "",
        message: data.get("text_input_2"),
        side: content.side,
        attending: yes,
      }),
    }).catch(() => null);
    if (res?.ok) {
      form.reset();
      setAttending(false);
      setPopup(THANKS_POPUP);
      return;
    }
    const err = await res?.json().catch(() => null);
    alert(err?.error ?? "Không gửi được, vui lòng kiểm tra mạng và thử lại");
  };

  const ctx = { content, owner: null, popup, setPopup, setAttending, onSubmit, countdown: null };
  return (
    <div className={`pageview side-${content.side}${attending ? " rsvp-yes" : ""}`} ref={root}>
      {tree.map((n, i) => <Fragment key={i}>{render(n, i, ctx)}</Fragment>)}
      <footer className="site-footer">— Made with ♥ by Tranh Nguyễn —</footer>
    </div>
  );
}
