import { useEffect, useRef, useState } from "react";
import { useReveal } from "../lib/useReveal.js";
import { rand, reduce } from "../lib/util.js";
import { blip, noise } from "../lib/sound.js";
import { burstAt } from "../lib/confetti.js";
import { UNIVERSES } from "../data.js";
import Heading from "./Heading.jsx";

// Act 5: a swirling portal; every jump lands in a universe where they're still best friends.
export default function Multiverse() {
  const ref = useReveal(), cvRef = useRef(null), st = useRef({ speed: 1, flash: 0 });
  const [idx, setIdx] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [gk, setGk] = useState(0);

  useEffect(() => {
    const px = cvRef.current.getContext("2d"); let alive = true, T = 0;
    const stars = Array.from({ length: 420 }, () => ({ a: rand(0, 6.283), r: Math.pow(Math.random(), 0.7), arm: (Math.random() * 3) | 0, s: rand(0.8, 2.6), h: Math.random() }));
    const draw = () => {
      if (!alive) return;
      const S2 = 680, c = S2 / 2, s = st.current;
      T += 0.004 * s.speed; s.speed += (1 - s.speed) * 0.03; s.flash *= 0.92;
      px.clearRect(0, 0, S2, S2);
      const g = px.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, `rgba(255,246,238,${0.25 + s.flash})`); g.addColorStop(0.25, "rgba(155,123,255,.35)"); g.addColorStop(0.6, "rgba(79,209,197,.12)"); g.addColorStop(1, "rgba(14,16,36,0)");
      px.fillStyle = g; px.beginPath(); px.arc(c, c, c, 0, 6.283); px.fill();
      px.globalCompositeOperation = "lighter";
      for (const p of stars) {
        const ang = p.a + T * (3 - p.r * 2) + p.arm * 2.094 + p.r * 4.5, r2 = p.r * c * 0.92;
        px.fillStyle = p.h < 0.45 ? "rgba(155,123,255,.85)" : p.h < 0.8 ? "rgba(79,209,197,.85)" : "rgba(255,209,102,.95)";
        px.beginPath(); px.arc(c + Math.cos(ang) * r2, c + Math.sin(ang) * r2, p.s * (1 - p.r * 0.4), 0, 6.283); px.fill();
      }
      px.globalCompositeOperation = "source-over";
      px.fillStyle = `rgba(14,16,36,${0.9 - s.flash})`; px.beginPath(); px.arc(c, c, 46 + Math.sin(T * 8) * 4, 0, 6.283); px.fill();
      px.strokeStyle = "rgba(255,209,102,.7)"; px.lineWidth = 3; px.stroke();
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
    return () => { alive = false; };
  }, []);

  const jump = () => {
    const n = (idx + 1 + Math.floor(Math.random() * (UNIVERSES.length - 2))) % UNIVERSES.length;
    st.current.speed = 18; st.current.flash = 0.7;
    noise(0.7, "bandpass", 300, 0.35, 1200); setTimeout(() => blip(660), 500);
    setTimeout(() => {
      setIdx(n); setGk((k) => k + 1);
      setVisited((v) => {
        const nv = new Set(v); nv.add(n);
        if (nv.size === UNIVERSES.length && v.size < UNIVERSES.length) burstAt(cvRef.current, 160);
        return nv;
      });
    }, 350);
  };

  const [no, txt] = UNIVERSES[idx];
  const done = visited.size >= UNIVERSES.length;
  return (
    <section className="act" id="multiverse" ref={ref}>
      <div className="wrap">
        <Heading eyebrow="Act five" title="The Maggi multiverse." lede="I checked every universe. In all of them, I still find you, and I still make you Maggi." />
        <div className="multi">
          <div className="portal-box rv" style={{ "--d": 2 }}><canvas ref={cvRef} width="680" height="680" aria-hidden="true" /></div>
          <div className="uni rv" style={{ "--d": 3 }}>
            <p className="uni-no">UNIVERSE #{no}</p>
            <p className={"uni-txt" + (gk ? " glitch" : "")} key={gk} aria-live="polite">{txt}</p>
            <div><button className="btn" onClick={jump}>Jump to another universe</button></div>
            <p className="uni-count">{done ? "All 12 universes visited. You’re my best friend in every one." : `${visited.size} of ${UNIVERSES.length} universes visited`}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
