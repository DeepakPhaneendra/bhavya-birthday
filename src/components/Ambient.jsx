import { useEffect, useRef } from "react";
import { fitCanvas, rand, reduce, fine } from "../lib/util.js";

// Drifting sparkles behind everything, plus a gold trail that follows the cursor on desktop.
export default function Ambient() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; let W, H, c, dots = [], trail = [], alive = true;
    const size = () => {
      [W, H, c] = fitCanvas(cv);
      dots = Array.from({ length: Math.round(Math.min(60, W / 20)) }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.6, 2.2), vy: rand(0.05, 0.25), p: rand(0, 6.28), col: Math.random() < 0.6 ? "255,209,102" : "255,111,145" }));
    };
    const onMove = (e) => { trail.push({ x: e.clientX, y: e.clientY, l: 1 }); if (trail.length > 26) trail.shift(); };
    size(); addEventListener("resize", size);
    if (fine) addEventListener("pointermove", onMove);
    const loop = (t) => {
      if (!alive) return;
      c.clearRect(0, 0, W, H);
      for (const d of dots) {
        if (!reduce) { d.y -= d.vy; if (d.y < -5) { d.y = H + 5; d.x = rand(0, W); } }
        c.fillStyle = `rgba(${d.col},${0.18 + 0.22 * Math.sin(t / 900 + d.p)})`; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      }
      trail.forEach((p, i) => { p.l -= 0.035; if (p.l > 0) { c.fillStyle = `rgba(255,209,102,${p.l * 0.5})`; c.beginPath(); c.arc(p.x + Math.sin(i + t / 200) * 2, p.y, 1 + p.l * 3 * (i / trail.length), 0, 6.283); c.fill(); } });
      trail = trail.filter((p) => p.l > 0);
      if (!reduce) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { alive = false; removeEventListener("resize", size); removeEventListener("pointermove", onMove); };
  }, []);
  return <canvas id="amb" ref={ref} aria-hidden="true" />;
}
