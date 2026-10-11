// "Catch the reels": reels rain down, she catches them in a Maggi bowl.
import { rand, clamp, fitCanvas, COLS } from "../lib/util.js";
import { noise, blip } from "../lib/sound.js";

export function makeCatcher(cv, cb) {
  let W, H, c, alive = true, items = [], sparks = [], running = false, score = 0, bx = 0, tx = 0, spawnT = 0, shake = 0, last = performance.now(), keys = {}, won = false;
  const GR = [["#ff6f91", "#c3b5ff"], ["#ffd166", "#ff6f91"], ["#7ee0c3", "#6b7cff"], ["#ffa36c", "#ff6f91"], ["#c3b5ff", "#6b7cff"]];
  const size = () => { [W, H, c] = fitCanvas(cv); if (!bx) bx = tx = W / 2; };
  const geom = () => ({ bw: Math.min(150, W * .34), by: H - 60 });
  const sc = () => clamp(W / 640, .8, 1.2);
  function spawn() {
    const r = Math.random(), type = score > 0 && r < .17 ? "cloud" : r < .27 ? "gold" : "reel", s = sc();
    items.push({ type, x: rand(30, W - 30), y: -50, vy: rand(150, 210) * (1 + score * .045) * (H / 640), w: (type === "cloud" ? 74 : 34) * s, h: (type === "cloud" ? 44 : 56) * s, rot: rand(-.35, .35), vr: rand(-1.2, 1.2), g: GR[Math.random() * GR.length | 0] });
  }
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
  function drawReel(it) {
    c.save(); c.translate(it.x, it.y); c.rotate(it.rot);
    const gold = it.type === "gold", g = c.createLinearGradient(-it.w / 2, -it.h / 2, it.w / 2, it.h / 2);
    g.addColorStop(0, gold ? "#fff1b8" : it.g[0]); g.addColorStop(1, gold ? "#ffb627" : it.g[1]);
    if (gold) { c.shadowColor = "rgba(255,209,102,.9)"; c.shadowBlur = 20; }
    c.fillStyle = g; rr(-it.w / 2, -it.h / 2, it.w, it.h, 7); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = "rgba(255,255,255,.95)"; c.beginPath(); c.moveTo(-it.w * .14, -it.h * .14); c.lineTo(it.w * .2, 0); c.lineTo(-it.w * .14, it.h * .14); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(-it.w * .34, it.h * .32, it.w * .68, 2.5); c.fillStyle = "#fff"; c.fillRect(-it.w * .34, it.h * .32, it.w * .3, 2.5);
    c.restore();
  }
  function drawCloud(it) {
    c.save(); c.translate(it.x, it.y); const w = it.w, h = it.h;
    c.fillStyle = "#59607e"; [[-w * .28, 0, h * .38], [0, -h * .18, h * .48], [w * .28, 0, h * .38], [0, h * .1, h * .38]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); });
    c.fillStyle = "#ffd166"; c.beginPath(); c.moveTo(2, h * .2); c.lineTo(-8, h * .62); c.lineTo(0, h * .58); c.lineTo(-5, h * .95); c.lineTo(10, h * .45); c.lineTo(2, h * .48); c.closePath(); c.fill();
    c.fillStyle = "#fff6ee"; c.font = `800 ${Math.round(10 * sc())}px 'Bricolage Grotesque', sans-serif`; c.textAlign = "center"; c.fillText("MONDAY", 0, -h * .08);
    c.restore();
  }
  function drawBowl(t) {
    const { bw, by } = geom(), x = bx;
    for (let i = 0; i < 2; i++) { c.strokeStyle = `rgba(255,246,238,${.12 + .05 * Math.sin(t / 300 + i)})`; c.lineWidth = 3; c.beginPath(); const sx = x - bw * .15 + i * bw * .3; c.moveTo(sx, by - 18); c.bezierCurveTo(sx - 10, by - 34, sx + 10, by - 46, sx, by - 62); c.stroke(); }
    c.fillStyle = "#d99a22"; c.beginPath(); c.ellipse(x, by, bw / 2 - 4, 12, 0, 0, 6.283); c.fill();
    c.strokeStyle = "#ffe7a3"; c.lineWidth = 2.5; c.lineCap = "round";
    for (let i = 0; i < 6; i++) { c.beginPath(); for (let j = 0; j <= 12; j++) { const px = x - bw * .38 + j * bw * .063, py = by - 6 + i * 2.2 + Math.sin(j * 1.4 + i * 2 + t * .004) * 3; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
    const g = c.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0); g.addColorStop(0, "#c94a6c"); g.addColorStop(.35, "#ff8fab"); g.addColorStop(1, "#b83e60");
    c.fillStyle = g; c.beginPath(); c.moveTo(x - bw / 2, by); c.bezierCurveTo(x - bw / 2, by + bw * .42, x + bw / 2, by + bw * .42, x + bw / 2, by); c.ellipse(x, by, bw / 2, 12, 0, 0, Math.PI); c.closePath(); c.fill();
    c.strokeStyle = "#fff6ee"; c.lineWidth = 3; c.beginPath(); c.ellipse(x, by, bw / 2, 12, 0, 0, 6.283); c.stroke();
    c.fillStyle = "#fff6ee"; c.font = `700 ${Math.round(17 * sc())}px 'Caveat', cursive`; c.textAlign = "center"; c.fillText("Bhavya", x, by + bw * .2);
  }
  function loop(t) {
    if (!alive) return;
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (keys.ArrowLeft) tx -= 520 * dt; if (keys.ArrowRight) tx += 520 * dt;
    const { bw, by } = geom(); tx = clamp(tx, bw / 2, W - bw / 2); bx += (tx - bx) * Math.min(1, dt * 14);
    c.clearRect(0, 0, W, H); c.save();
    if (shake > 0) { shake -= dt; c.translate(rand(-6, 6) * shake * 2, rand(-6, 6) * shake * 2); }
    if (running) { spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = Math.max(.42, .85 - score * .035); } }
    items = items.filter(it => {
      it.y += it.vy * dt; it.rot += it.vr * dt;
      const bottom = it.y + it.h / 2;
      if (bottom >= by - 10 && bottom <= by + 26 && Math.abs(it.x - bx) < bw / 2 + it.w * .2) {
        if (it.type === "cloud") { score = Math.max(0, score - 1); shake = .45; noise(.4, "lowpass", 300, .5); cb.onCatch(score, "cloud"); }
        else {
          score = Math.min(12, score + (it.type === "gold" ? 2 : 1)); blip(it.type === "gold" ? 880 : 520 + score * 30);
          for (let i = 0; i < (it.type === "gold" ? 30 : 14); i++) { const a = rand(-Math.PI, 0), s = rand(80, 260); sparks.push({ x: it.x, y: by - 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, c: it.type === "gold" ? "#ffd166" : COLS[Math.random() * COLS.length | 0], heart: Math.random() < .4 }); }
          cb.onCatch(score, it.type);
          if (score >= 12 && !won) { won = true; running = false; items = []; cb.onWin(); }
        }
        return false;
      }
      if (it.y - it.h > H) return false;
      it.type === "cloud" ? drawCloud(it) : drawReel(it);
      return true;
    });
    drawBowl(t);
    sparks = sparks.filter(p => {
      p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt * 1.2; if (p.l <= 0) return false;
      c.globalAlpha = p.l; c.fillStyle = p.c;
      if (p.heart) { c.save(); c.translate(p.x, p.y); c.scale(.6, .6); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-14, -4, -6, -14, 0, -6); c.bezierCurveTo(6, -14, 14, -4, 0, 6); c.fill(); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, 2.4, 0, 6.283); c.fill(); }
      c.globalAlpha = 1; return true;
    });
    c.restore();
    requestAnimationFrame(loop);
  }
  const move = (e) => { const r = cv.getBoundingClientRect(); tx = e.clientX - r.left; };
  const kd = (e) => { if (!running) return; if (e.key === "ArrowLeft" || e.key === "ArrowRight") { keys[e.key] = true; e.preventDefault(); } };
  const ku = (e) => { keys[e.key] = false; };
  cv.addEventListener("pointermove", move); cv.addEventListener("pointerdown", move);
  addEventListener("keydown", kd); addEventListener("keyup", ku);
  size(); requestAnimationFrame(loop);
  return {
    start() { items = []; sparks = []; score = 0; won = false; running = true; spawnT = .3; cb.onCatch(0, "start"); },
    resize: size,
    destroy() { alive = false; cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerdown", move); removeEventListener("keydown", kd); removeEventListener("keyup", ku); }
  };
}
