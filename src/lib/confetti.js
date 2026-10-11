// Page-wide confetti: petals, paper bits and little noodles.
import { COLS, DPR, rand, reduce } from "./util.js";

const fx = document.createElement("canvas");
fx.id = "fx"; fx.setAttribute("aria-hidden", "true");
document.body.appendChild(fx);
const c = fx.getContext("2d");
let parts = [], running = false, VW, VH;

function size() { VW = innerWidth; VH = innerHeight; fx.width = VW * DPR; fx.height = VH * DPR; c.setTransform(DPR, 0, 0, DPR, 0, 0); }
size(); addEventListener("resize", size);

export function burst(x, y, n = 120, spread = 7) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, s = 2 + Math.random() * spread;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 5, r: Math.random() * 6, vr: rand(-0.3, 0.3), w: rand(5, 12), h: rand(4, 8), life: 0, max: rand(120, 200),
      kind: Math.random() < 0.3 ? "noodle" : Math.random() < 0.5 ? "petal" : "bit", col: COLS[(Math.random() * COLS.length) | 0] });
  }
  if (!running) { running = true; requestAnimationFrame(step); }
}
export function burstAt(el, n, dy = 0.5) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height * dy, n);
}

function step() {
  c.clearRect(0, 0, VW, VH);
  parts = parts.filter((p) => p.life < p.max && p.y < VH + 60);
  for (const p of parts) {
    p.life++; p.vy = Math.min(p.vy + 0.14, 4.5); p.vx *= 0.985;
    p.x += p.vx + Math.sin(p.life / 12) * 0.6; p.y += p.vy; p.r += p.vr;
    c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.min(1, (p.max - p.life) / 40);
    if (p.kind === "noodle") {
      c.strokeStyle = "#ffd166"; c.lineWidth = 3; c.lineCap = "round"; c.beginPath();
      for (let i = 0; i <= 10; i++) { const x = -12 + i * 2.4, y = Math.sin(i * 1.4) * 3; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    } else {
      c.fillStyle = p.col;
      if (p.kind === "petal") { c.beginPath(); c.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 6.283); c.fill(); }
      else c.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2);
    }
    c.restore();
  }
  if (parts.length) requestAnimationFrame(step);
  else { running = false; c.clearRect(0, 0, VW, VH); }
}
