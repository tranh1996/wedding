"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import tree from "@/lib/tree.json";
import { content } from "@/lib/content";
import Calendar from "./Calendar";
import MusicToggle from "./MusicToggle";

const VOID = new Set(["br", "img", "input", "hr"]);
const GIFT_POPUP = "w-2czgudf9";
const THANKS_POPUP = "w-__popup_default__";

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
  const [parts, setParts] = useState(() => countdownParts(content.weddingDate, new Date(content.weddingDate).getTime()));
  useEffect(() => {
    const tick = () => setParts(countdownParts(content.weddingDate, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div {...props(node)}>{(node.c ?? []).map((c, i) => render(c, i, { ...ctx, countdown: parts }))}</div>;
}

// ctx: { owner, popup, setPopup, onSubmit, countdown }
function render(node, key, ctx) {
  if (typeof node === "string") return node;
  const { t: Tag, a, c } = node;
  const id = a.id;
  const cls = a.className ?? "";

  if (id === "w-0dyp082l") return <div key={key} {...props(node)}><div className="frame-html-box full-width full-height"><MusicToggle /></div></div>;
  if (id === "w-niirgp9l") return <div key={key} {...props(node)}><div className="frame-html-box full-width full-height"><Calendar /></div></div>;
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

  // text replaced from lib/content.js
  let owner = ctx.owner;
  if (cls.includes("com-text-block")) owner = id;
  if (cls.includes("text-block-css") && content.texts[owner] !== undefined) {
    kids = [content.texts[owner]];
    extra.style = { whiteSpace: "pre-line" };
  }

  // countdown numbers
  const unit = cls.match(/countdown-item-(day|hour|minute|second)/)?.[1];
  if (unit && ctx.countdown && c) kids = [{ ...c[0], c: [ctx.countdown[unit]] }, ...c.slice(1)];

  const p = props(node, extra);
  if (Tag === "option") delete p.selected;
  const childCtx = { ...ctx, owner };
  if (VOID.has(Tag)) return <Tag key={key} {...p} />;
  return <Tag key={key} {...p}>{(kids ?? []).map((k, i) => render(k, i, childCtx))}</Tag>;
}

export default function Template() {
  const [popup, setPopup] = useState(null);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("full_name"),
        relation: data.get("text_input_1"),
        message: data.get("text_input_2"),
        attending: data.get("select_1") === "Có Tham Dự",
      }),
    }).catch(() => null);
    if (res?.ok) {
      form.reset();
      setPopup(THANKS_POPUP);
    }
  };

  const ctx = { owner: null, popup, setPopup, onSubmit, countdown: null };
  return (
    <div className="pageview" ref={root}>
      {tree.map((n, i) => <Fragment key={i}>{render(n, i, ctx)}</Fragment>)}
    </div>
  );
}
