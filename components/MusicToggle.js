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
    let started = false;
    const startOnce = () => {
      if (started) return;
      el.play().then(() => (started = true)).catch(() => {});
    };
    document.body.addEventListener("click", startOnce, { once: true });
    document.body.addEventListener("touchstart", startOnce, { once: true, passive: true });
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      document.body.removeEventListener("click", startOnce);
      document.body.removeEventListener("touchstart", startOnce);
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
      <audio ref={audio} id="background-music" src={assets.music} preload="none" loop />
      <div id="music-toggle" className={playing ? "vibrating" : ""} title="Bật / Tắt nhạc" aria-label="Bật / Tắt nhạc" onClick={toggle}>
        <img id="play-icon" src={assets.playIcon} alt="Play" width={44} height={44} style={{ display: playing ? "none" : "block" }} />
        <img id="pause-icon" src={assets.pauseIcon} alt="Pause" width={44} height={44} style={{ display: playing ? "block" : "none" }} />
      </div>
    </>
  );
}
