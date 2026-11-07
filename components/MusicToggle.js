"use client";

import { useEffect, useRef, useState } from "react";
import assets from "@/lib/assets.json";

// Port of the original html box: audio starts on the first tap, round button toggles it.
export default function MusicToggle() {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audio.current;
    el.volume = 0.6;
    // Start on the first real user gesture anywhere on the page. Browsers only allow audio after
    // click / touchend / keydown (not touchstart or scroll), so keep listening until play() succeeds.
    // Bubble phase on document: the toggle button stops propagation, so tapping it never double-fires.
    const events = ["click", "touchend", "keydown"];
    const stop = () => events.forEach((ev) => document.removeEventListener(ev, startOnce));
    function startOnce(e) {
      // taps on the toggle itself are handled by its own onClick (touchend fires before click)
      if (e?.target?.closest?.("#music-toggle")) return;
      el.play().catch(() => {});
    }
    events.forEach((ev) => document.addEventListener(ev, startOnce));
    startOnce(); // some browsers allow autoplay straight away
    // once music has started (by any route) stop auto-starting, so it never restarts after the guest pauses it
    const onPlay = () => { setPlaying(true); stop(); };
    const onPause = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      stop();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audio.current;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <>
      <audio ref={audio} id="background-music" src={assets.music} preload="auto" loop />
      <div id="music-toggle" className={playing ? "vibrating" : ""} title="Bật / Tắt nhạc" aria-label="Bật / Tắt nhạc" onClick={toggle}>
        <img id="play-icon" src={assets.playIcon} alt="Play" width={44} height={44} style={{ display: playing ? "none" : "block" }} />
        <img id="pause-icon" src={assets.pauseIcon} alt="Pause" width={44} height={44} style={{ display: playing ? "block" : "none" }} />
      </div>
    </>
  );
}
