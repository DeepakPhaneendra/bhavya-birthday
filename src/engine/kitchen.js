// The kitchen: stove, pot, jug, noodle cake, masala, spoon and the noodles that spell her name.
// Everything is drawn on one canvas; React only renders the text and buttons above it.
import { rand, clamp, ease, easeOut, smooth, lerpColor, fitCanvas, roundRect, DPR, reduce } from "../lib/util.js";
import { noise, blip, ding } from "../lib/sound.js";
import { burst } from "../lib/confetti.js";

const GRAV = 1500;
const WATER = ["8fc3e0", "4f8fb8"], SOUP = ["e8913a", "b85a1f"];
const POWDER = ["#e8792a", "#c9531f", "#f2a14a", "#a8401a"];

/* ---------- letters for BHAVYA, drawn as strokes in a unit box ---------- */
function bowlStroke(y0, y1, w) {
  const p = [];
  for (let i = 0; i <= 24; i++) { const th = -Math.PI / 2 + (Math.PI * i) / 24; p.push([w * Math.cos(th), (y0 + y1) / 2 + ((y1 - y0) / 2) * Math.sin(th)]); }
  return p;
}
const LET = {
  B: { w: 0.62, s: [[[0, 0], [0, 1]], bowlStroke(0, 0.48, 0.52), bowlStroke(0.48, 1, 0.62)] },
  H: { w: 0.62, s: [[[0, 0], [0, 1]], [[0.62, 0], [0.62, 1]], [[0, 0.5], [0.62, 0.5]]] },
  A: { w: 0.72, s: [[[0, 1], [0.36, 0]], [[0.36, 0], [0.72, 1]], [[0.16, 0.62], [0.56, 0.62]]] },
  V: { w: 0.72, s: [[[0, 0], [0.36, 1]], [[0.36, 1], [0.72, 0]]] },
  Y: { w: 0.72, s: [[[0, 0], [0.36, 0.52]], [[0.72, 0], [0.36, 0.52]], [[0.36, 0.52], [0.36, 1]]] }
};
const WORD = "BHAVYA", GAP = 0.26, PTS = 44;
function strokes() {
  const out = []; let x = 0;
  for (const ch of WORD) { for (const s of LET[ch].s) out.push(s.map(([a, b]) => [a + x, b])); x += LET[ch].w + GAP; }
  return out;
}
function resample(poly, n) {
  const d = [0];
  for (let i = 1; i < poly.length; i++) d.push(d[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const L = d[d.length - 1], out = [];
  for (let j = 0; j < n; j++) {
    const t = (L * j) / (n - 1); let i = 1;
    while (i < d.length - 1 && d[i] < t) i++;
    const f = (t - d[i - 1]) / (d[i] - d[i - 1] || 1);
    out.push([poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * f, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * f]);
  }
  return out;
}

/* ---------- the noodle cake texture (top face + crinkly side) ---------- */
function makeCakeTexture(cw, ch, cd) {
  const oc = document.createElement("canvas");
  oc.width = Math.ceil(cw * DPR); oc.height = Math.ceil((ch + cd) * DPR);
  const o = oc.getContext("2d"); o.scale(DPR, DPR);
  o.save(); roundRect(o, 0, 0, cw, ch + cd, 10); o.clip();
  let g = o.createLinearGradient(0, ch, 0, ch + cd); g.addColorStop(0, "#d39a2a"); g.addColorStop(1, "#8f600f");
  o.fillStyle = g; o.fillRect(0, 0, cw, ch + cd);
  o.strokeStyle = "rgba(110,70,10,.55)"; o.lineWidth = 1.3;
  for (let y = ch + 2.5; y < ch + cd; y += 3.2) { o.beginPath(); for (let x = 0; x <= cw; x += 2) { const yy = y + Math.sin(x * 0.75 + y * 3) * 1.1; x ? o.lineTo(x, yy) : o.moveTo(x, yy); } o.stroke(); }
  g = o.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#ffdc7e"); g.addColorStop(1, "#efb53a");
  o.fillStyle = g; o.fillRect(0, 0, cw, ch);
  let row = 0;
  for (let y = 1.5; y < ch; y += 3, row++) {
    const ph = rand(0, 6.28);
    o.strokeStyle = row % 2 ? "rgba(196,132,26,.9)" : "rgba(255,238,178,.8)"; o.lineWidth = 1.7;
    o.beginPath();
    for (let x = -2; x <= cw + 2; x += 2) { const yy = y + Math.sin(x * 0.6 + ph) * 1.5; x > -2 ? o.lineTo(x, yy) : o.moveTo(x, yy); }
    o.stroke();
  }
  const sh = o.createRadialGradient(cw * 0.35, ch * 0.3, 0, cw * 0.35, ch * 0.3, cw * 0.7);
  sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(1, "rgba(0,0,0,.08)");
  o.fillStyle = sh; o.fillRect(0, 0, cw, ch);
  o.fillStyle = "rgba(60,35,5,.25)"; o.fillRect(0, ch - 1.5, cw, 1.5);
  o.restore();
  return oc;
}
function jagged(a, b, n, amp) {
  const pts = [a];
  for (let i = 1; i < n; i++) {
    const t = i / n, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const j = rand(-amp, amp);
    pts.push([a[0] + dx * t + (-dy / len) * j, a[1] + dy * t + (dx / len) * j]);
  }
  pts.push(b);
  return pts;
}

export function makeKitchen(cv, getUIB, cb) {
  const k = cv.getContext("2d");
  let W = 0, H = 0, G = {}, alive = true, lastT = performance.now(), tangles = [], tex = null;
  let S = fresh();
  function fresh() {
    return {
      step: 0, stove: false, ignite: 0, knob: 0, water: 0, jug: null,
      cake: null, chunks: [], crumbs: [], sinking: [], potNoodles: 0,
      sachet: null, scrap: null, powder: [], blooms: [], masala: 0,
      stir: 0, stirAng: 0, stirVel: 0, spoonAng: -0.4, spoon: false, dragging: false,
      boil: 0, bubbles: [], steam: [], drops: [], ripples: [], foam: [],
      reveal: null, glow: 0, busy: false
    };
  }

  /* ---------- geometry ---------- */
  function geo() {
    [W, H] = fitCanvas(cv);
    const pw = Math.min(W * 0.58, 330), rx = pw / 2, ry = pw * 0.13, potH = pw * 0.5;
    const rimY = H - potH - Math.max(66, H * 0.1), bottomY = rimY + potH, counterY = bottomY + 30;
    const cw = rx * 1.1, ch = cw * 0.42, cd = ch * 0.3, s = Math.max(0.8, pw / 330);
    const strip = H - counterY;
    G = { cx: W / 2, pw, rx, ry, potH, rimY, bottomY, counterY, cw, ch, cd, s, uiB: getUIB(), lvl: 0,
      knob: { x: Math.max(28, W / 2 - rx - 54), y: counterY + strip / 2, r: Math.max(8, Math.min(14, strip / 2 - 5)) } };
    tex = makeCakeTexture(cw, ch, cd);
    if (S.reveal) buildTargets(S.reveal.noodles);
  }
  const surfY = () => G.rimY + G.lvl;
  const floatY = (h) => Math.min(G.rimY - G.ry - h / 2 - 16, Math.max(G.rimY - G.pw * 0.66, G.uiB + h / 2 + 22));
  const potToScreen = ([u, v]) => {
    const c = Math.cos(S.stirAng), s = Math.sin(S.stirAng);
    return [G.cx + (u * c - v * s) * G.rx * 0.8, surfY() + (u * s + v * c) * G.ry * 0.8];
  };
  const screenToPot = (x, y) => {
    const u0 = (x - G.cx) / (G.rx * 0.8), v0 = (y - surfY()) / (G.ry * 0.8), c = Math.cos(-S.stirAng), s = Math.sin(-S.stirAng);
    return [u0 * c - v0 * s, u0 * s + v0 * c];
  };
  const inPot = (x) => Math.abs(x - G.cx) < G.rx * 0.9;

  function makeTangles() {
    tangles = [];
    for (let n = 0; n < strokes().length * 2; n++) {
      let u = rand(-0.6, 0.6), v = rand(-0.6, 0.6), a = rand(0, 6.283); const pts = [];
      for (let i = 0; i < PTS; i++) {
        pts.push([u, v]); a += rand(-0.7, 0.7);
        if (u * u + v * v > 0.7) a = Math.atan2(-v, -u) + rand(-0.5, 0.5);
        u += Math.cos(a) * 0.06; v += Math.sin(a) * 0.06;
      }
      tangles.push(pts);
    }
  }
  makeTangles();

  function layout() {
    const total = [...WORD].reduce((a, c) => a + LET[c].w, 0) + GAP * (WORD.length - 1);
    const unit = Math.min(W * (W < 600 ? 0.92 : 0.86) / total, H * 0.2, 150);
    const top = Math.max(W < 600 ? 72 : 84, Math.min(H * 0.2, G.rimY - unit - 170));
    return { unit, x0: (W - total * unit) / 2, top, lw: Math.max(3.2, unit * 0.06) };
  }
  function buildTargets(noodles) {
    const L = layout(); let n = 0;
    for (const st of strokes()) {
      const base = resample(st, PTS);
      for (const off of [-0.5, 0.5]) {
        const tg = base.map((p, i) => {
          const q = base[Math.min(i + 1, PTS - 1)], o = base[Math.max(i - 1, 0)], dx = q[0] - o[0], dy = q[1] - o[1], len = Math.hypot(dx, dy) || 1;
          return [L.x0 + p[0] * L.unit + (-dy / len) * off * L.lw * 1.05, L.top + p[1] * L.unit + (dx / len) * off * L.lw * 1.05];
        });
        if (noodles[n]) noodles[n].target = tg;
        n++;
      }
    }
    S.reveal.L = L;
  }

  /* ---------- drawing helpers ---------- */
  function drawNoodle(pts, lw, amp, phase, t) {
    const m = pts.length, q = new Array(m);
    for (let i = 0; i < m; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, m - 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const w = amp * Math.sin(i * 1.3 + phase + t * 0.004);
      q[i] = [pts[i][0] - (dy / len) * w, pts[i][1] + (dx / len) * w];
    }
    const path = () => {
      k.beginPath(); k.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < m - 1; i++) k.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
      k.lineTo(q[m - 1][0], q[m - 1][1]);
    };
    k.lineCap = "round"; k.lineJoin = "round";
    path(); k.strokeStyle = "#d99a22"; k.lineWidth = lw; k.stroke();
    k.save(); k.translate(-lw * 0.14, -lw * 0.18); path(); k.strokeStyle = "rgba(255,231,163,.85)"; k.lineWidth = lw * 0.36; k.stroke(); k.restore();
  }
  const surfaceClip = () => { k.beginPath(); k.ellipse(G.cx, G.rimY, G.rx * 0.95, G.ry * 0.82, 0, 0, 6.283); k.clip(); };
  function pulseRing(x, y, r, t) {
    const p = (t / 1100) % 1;
    k.strokeStyle = `rgba(255,209,102,${0.7 * (1 - p)})`; k.lineWidth = 2.5;
    k.beginPath(); k.arc(x, y, r + p * 18, 0, 6.283); k.stroke();
  }

  function drawStove(t) {
    const { cx, rx, bottomY, counterY, pw } = G;
    if (S.glow > 0.01) {
      const g = k.createRadialGradient(cx, bottomY + 20, 0, cx, bottomY + 20, pw * 1.5);
      g.addColorStop(0, `rgba(255,150,120,${0.38 * S.glow})`); g.addColorStop(1, "rgba(255,150,120,0)");
      k.fillStyle = g; k.fillRect(0, 0, W, H);
    }
    const cg = k.createLinearGradient(0, counterY, 0, H); cg.addColorStop(0, "#1a2045"); cg.addColorStop(1, "#0f132c");
    k.fillStyle = cg; k.fillRect(0, counterY, W, H - counterY);
    k.fillStyle = "#2f3770"; k.fillRect(0, counterY, W, 2);
    // stove plate + grate
    k.fillStyle = "#0b0d1f"; k.beginPath(); k.ellipse(cx, bottomY + 27, rx * 0.95, 10, 0, 0, 6.283); k.fill();
    k.strokeStyle = "#2b2f45"; k.lineWidth = 4; k.lineCap = "round";
    for (const off of [-0.55, 0.55]) { k.beginPath(); k.moveTo(cx + rx * off - 14, bottomY + 4); k.lineTo(cx + rx * off, bottomY + 22); k.lineTo(cx + rx * off + 14, bottomY + 4); k.stroke(); }
    // flames, lit from the centre outwards
    if (S.stove) {
      const n = 13;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(i - (n - 1) / 2) * 0.045, on = smooth(d, d + 0.18, S.ignite);
        if (on <= 0) continue;
        const x = cx - rx * 0.72 + (rx * 1.44 * i) / (n - 1);
        const h = (15 + 7 * Math.sin(t * 0.02 + i * 1.7) + rand(0, 4)) * on * (1 + S.boil * 0.35);
        const g = k.createLinearGradient(x, bottomY + 26, x, bottomY + 26 - h);
        g.addColorStop(0, "rgba(70,130,255,.95)"); g.addColorStop(0.5, "rgba(130,180,255,.75)"); g.addColorStop(1, "rgba(255,170,80,0)");
        k.fillStyle = g; k.beginPath(); k.moveTo(x - 5.5, bottomY + 26);
        k.quadraticCurveTo(x - 5, bottomY + 26 - h * 0.6, x, bottomY + 26 - h); k.quadraticCurveTo(x + 5, bottomY + 26 - h * 0.6, x + 5.5, bottomY + 26); k.fill();
      }
      if (S.ignite < 0.35) {
        const a = 1 - S.ignite / 0.35, g = k.createRadialGradient(cx, bottomY + 22, 0, cx, bottomY + 22, rx * 0.9);
        g.addColorStop(0, `rgba(190,215,255,${0.85 * a})`); g.addColorStop(1, "rgba(120,160,255,0)");
        k.fillStyle = g; k.fillRect(cx - rx, bottomY - 40, rx * 2, 80);
      }
    }
    // knob
    const K = G.knob, ang = -Math.PI / 2 + S.knob * Math.PI * 0.75;
    k.fillStyle = "#0b0d1f"; k.beginPath(); k.arc(K.x, K.y + 2, K.r + 1, 0, 6.283); k.fill();
    const kg = k.createRadialGradient(K.x - K.r * 0.3, K.y - K.r * 0.3, 1, K.x, K.y, K.r);
    kg.addColorStop(0, "#dfe4ec"); kg.addColorStop(1, "#7d8594");
    k.fillStyle = kg; k.beginPath(); k.arc(K.x, K.y, K.r, 0, 6.283); k.fill();
    k.strokeStyle = S.stove ? "#ff8a3d" : "#2b2f45"; k.lineWidth = 3; k.lineCap = "round";
    k.beginPath(); k.moveTo(K.x, K.y); k.lineTo(K.x + Math.cos(ang) * K.r * 0.85, K.y + Math.sin(ang) * K.r * 0.85); k.stroke();
    if (S.step === 1 && !S.stove) pulseRing(K.x, K.y, K.r + 3, t);
  }

  function drawPot(t) {
    const { cx, rx, ry, rimY, bottomY, potH } = G;
    k.beginPath(); k.moveTo(cx - rx, rimY); k.lineTo(cx - rx * 0.93, bottomY - 12);
    k.quadraticCurveTo(cx - rx * 0.92, bottomY, cx - rx * 0.8, bottomY); k.lineTo(cx + rx * 0.8, bottomY);
    k.quadraticCurveTo(cx + rx * 0.92, bottomY, cx + rx * 0.93, bottomY - 12); k.lineTo(cx + rx, rimY);
    k.ellipse(cx, rimY, rx, ry, 0, 0, Math.PI); k.closePath();
    const pg = k.createLinearGradient(cx - rx, 0, cx + rx, 0);
    pg.addColorStop(0, "#3c4148"); pg.addColorStop(0.28, "#c3cbd4"); pg.addColorStop(0.45, "#8a929b"); pg.addColorStop(0.8, "#4c535b"); pg.addColorStop(1, "#2c3035");
    k.fillStyle = pg; k.fill();
    k.fillStyle = "rgba(255,255,255,.2)"; k.fillRect(cx - rx * 0.62, rimY + ry + 6, 5, potH * 0.55);
    k.fillStyle = "rgba(255,170,120,.10)"; k.fillRect(cx - rx * 0.9, bottomY - 14, rx * 1.8, 14);
    k.fillStyle = "#1e1a2c";
    roundRect(k, cx - rx - 30, rimY + 8, 32, 11, 5); k.fill();
    roundRect(k, cx + rx - 2, rimY + 8, 32, 11, 5); k.fill();
    // inside of the pot
    k.fillStyle = "#1c1f23"; k.beginPath(); k.ellipse(cx, rimY, rx * 0.95, ry * 0.82, 0, 0, 6.283); k.fill();
  }

  function drawWater(t) {
    const { cx, rx, ry } = G;
    if (S.water <= 0) return;
    const sy = surfY(), mix = clamp(S.masala * (0.3 + 0.7 * S.stir));
    k.save(); surfaceClip(); k.globalAlpha = Math.min(1, S.water * 2.5);
    const g = k.createLinearGradient(0, sy - ry, 0, sy + ry);
    g.addColorStop(0, lerpColor(WATER[0], SOUP[0], mix)); g.addColorStop(1, lerpColor(WATER[1], SOUP[1], mix));
    k.fillStyle = g; k.beginPath(); k.ellipse(cx, sy, rx * 0.95, ry * 0.82, 0, 0, 6.283); k.fill();
    // masala clouds blooming in the water
    S.blooms = S.blooms.filter((b) => {
      b.r += (b.max - b.r) * 0.04; b.a -= (0.02 + Math.abs(S.stirVel) * 0.05) * (1 / 60);
      if (b.a <= 0) return false;
      const [x, y] = potToScreen([b.u, b.v]);
      k.save(); k.translate(x, y); k.scale(1, ry / rx);
      const bg = k.createRadialGradient(0, 0, 0, 0, 0, b.r * rx);
      bg.addColorStop(0, `rgba(214,105,35,${b.a})`); bg.addColorStop(1, "rgba(214,105,35,0)");
      k.fillStyle = bg; k.beginPath(); k.arc(0, 0, b.r * rx, 0, 6.283); k.fill(); k.restore();
      return true;
    });
    // the vortex while stirring
    const sw = clamp(Math.abs(S.stirVel) * 0.06, 0, 0.55);
    if (sw > 0.02) {
      k.save(); k.translate(cx, sy); k.scale(1, ry / rx);
      const vg = k.createRadialGradient(0, 0, 0, 0, 0, rx * 0.45);
      vg.addColorStop(0, `rgba(0,0,0,${sw * 0.45})`); vg.addColorStop(1, "rgba(0,0,0,0)");
      k.fillStyle = vg; k.beginPath(); k.arc(0, 0, rx * 0.45, 0, 6.283); k.fill(); k.restore();
      for (let j = 0; j < 4; j++) {
        const rr = 0.22 + j * 0.18, a0 = S.stirAng * 1.3 + j * 1.7;
        k.strokeStyle = `rgba(255,255,255,${sw * (1 - j * 0.18)})`; k.lineWidth = 1.6; k.beginPath();
        for (let i = 0; i <= 20; i++) { const th = a0 + (i / 20) * 1.5 * Math.sign(S.stirVel || 1); const x = cx + Math.cos(th) * rx * 0.9 * rr, y = sy + Math.sin(th) * ry * 0.9 * rr; i ? k.lineTo(x, y) : k.moveTo(x, y); }
        k.stroke();
      }
    }
    // highlight, ripples, foam
    k.fillStyle = "rgba(255,255,255,.15)"; k.beginPath(); k.ellipse(cx - rx * 0.28 + Math.sin(t * 0.0012) * rx * 0.08, sy - ry * 0.25, rx * 0.3, ry * 0.16, 0, 0, 6.283); k.fill();
    S.ripples = S.ripples.filter((r) => {
      r.r += 70 / 60; r.a -= 0.016; if (r.a <= 0) return false;
      k.strokeStyle = `rgba(255,255,255,${r.a})`; k.lineWidth = 1.5; k.beginPath(); k.ellipse(r.x, sy, r.r, (r.r * ry) / rx, 0, 0, 6.283); k.stroke();
      return true;
    });
    S.foam = S.foam.filter((f) => {
      f.r += 0.08; f.a -= 0.012; if (f.a <= 0) return false;
      k.fillStyle = `rgba(255,255,255,${f.a})`; k.beginPath(); k.arc(f.x, sy + f.dy, f.r, 0, 6.283); k.fill();
      return true;
    });
    k.restore();
  }

  function drawPotNoodles(t) {
    if (S.potNoodles <= 0) return;
    k.save(); surfaceClip(); k.globalAlpha = S.potNoodles;
    const lw = Math.max(2.4, G.pw * 0.012), bob = S.boil * 0.6;
    tangles.forEach((tg, i) => drawNoodle(tg.map(potToScreen), lw, lw * (0.8 + bob), i, t));
    k.restore();
  }

  function drawCakeAt(x, y, rot, shake) {
    const { cw, ch, cd } = G;
    k.save(); k.translate(x + (shake ? rand(-shake, shake) : 0), y + (shake ? rand(-shake, shake) : 0)); k.rotate(rot);
    k.fillStyle = "rgba(0,0,0,.25)"; k.beginPath(); k.ellipse(0, ch / 2 + cd + 6, cw * 0.45, 5, 0, 0, 6.283); k.fill();
    k.drawImage(tex, -cw / 2, -ch / 2, cw, ch + cd);
    k.restore();
  }
  function drawCrack(x, y, rot, p) {
    const C = S.cake.crack;
    k.save(); k.translate(x, y); k.rotate(rot);
    k.strokeStyle = "rgba(90,55,8,.95)"; k.lineWidth = 2; k.lineCap = "round"; k.lineJoin = "round";
    for (const line of [C.vt.slice().reverse(), C.vb, C.hl.slice().reverse(), C.hr]) {
      const n = Math.max(1, Math.round(line.length * p));
      k.beginPath(); k.moveTo(line[0][0], line[0][1]); for (let i = 1; i < n; i++) k.lineTo(line[i][0], line[i][1]); k.stroke();
    }
    k.restore();
  }
  function drawChunk(c, alpha = 1, under = false) {
    k.save(); k.globalAlpha = alpha; k.translate(c.x, c.y); k.rotate(c.r); if (c.sc) k.scale(c.sc, c.sc); k.translate(-c.c[0], -c.c[1]);
    const path = () => { k.beginPath(); c.poly.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); };
    k.save(); path(); k.clip(); k.drawImage(tex, -G.cw / 2, -G.ch / 2, G.cw, G.ch + G.cd); k.restore();
    path(); k.strokeStyle = "rgba(120,80,15,.75)"; k.lineWidth = 1.2; k.stroke();
    if (under) { path(); k.fillStyle = "rgba(120,170,210,.35)"; k.fill(); }
    k.restore();
  }

  function breakCake() {
    const { cw, ch, cd } = G, C = S.cake, top = -ch / 2, bot = ch / 2 + cd, l = -cw / 2, r = cw / 2;
    const vx0 = rand(-cw * 0.08, cw * 0.08), vx1 = rand(-cw * 0.08, cw * 0.08), hy0 = rand(-ch * 0.12, ch * 0.12), hy1 = rand(-ch * 0.12, ch * 0.12);
    C.crack = {
      vt: jagged([vx0, top], [0, 0], 5, 3), vb: jagged([0, 0], [vx1, bot], 5, 3),
      hl: jagged([l, hy0], [0, 0], 7, 3), hr: jagged([0, 0], [r, hy1], 7, 3)
    };
    C.mode = "crack"; C.t = 0;
    [0, 0.12, 0.26].forEach((d) => setTimeout(() => noise(0.09, "bandpass", 1300, 0.45), d * 1000));
  }
  function splitCake() {
    const { cw, ch, cd } = G, C = S.cake, cr = C.crack, top = -ch / 2, bot = ch / 2 + cd, l = -cw / 2, r = cw / 2;
    const vt = cr.vt, vb = cr.vb, hl = cr.hl, hr = cr.hr;
    const rev = (a) => a.slice().reverse();
    const polys = [
      [[l, top], vt[0], ...vt.slice(1), ...rev(hl).slice(1)],
      [vt[0], [r, top], hr[hr.length - 1], ...rev(hr).slice(1), ...rev(vt).slice(1)],
      [[0, 0], ...hr.slice(1), [r, bot], vb[vb.length - 1], ...rev(vb).slice(1, -1)],
      [hl[0], ...hl.slice(1), ...vb.slice(1), [l, bot]]
    ];
    S.chunks = polys.map((poly) => {
      const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
      const dir = Math.atan2(c[1], c[0]);
      return { poly, c, x: G.cx + c[0], y: C.y + c[1], vx: Math.cos(dir) * rand(40, 85), vy: -rand(150, 260), r: 0, vr: Math.sign(c[0] || 1) * rand(1.5, 3.5) };
    });
    for (let i = 0; i < 26; i++) {
      const a = rand(0, 6.283);
      S.crumbs.push({ x: G.cx + rand(-8, 8), y: C.y + rand(-6, 6), vx: Math.cos(a) * rand(30, 160), vy: -rand(80, 300), r: rand(0, 6), vr: rand(-8, 8) });
    }
    S.cake = null;
    noise(0.18, "bandpass", 1100, 0.5);
  }

  function drawSachet(t, dt) {
    const Sa = S.sachet, s = G.s, sw = 78 * s, sh = 54 * s;
    if (Sa.mode === "float") { Sa.x = G.cx + G.rx * 0.12; Sa.y = floatY(sh); Sa.rot = Math.sin(t * 0.002) * 0.06; }
    else if (Sa.mode === "tear") { Sa.t += dt; Sa.rot += (0.25 - Sa.rot) * 0.2; if (Sa.t > 0.3) { Sa.mode = "pour"; Sa.t = 0; } }
    else if (Sa.mode === "pour") {
      Sa.t += dt; Sa.rot += (2.2 - Sa.rot) * Math.min(1, dt * 6);
      if (Sa.t > 0.35 && Sa.t < 1.9) {
        const ca = Math.cos(Sa.rot), sa = Math.sin(Sa.rot), lx = sw / 2 - 6 * s, ly = -sh / 2 + 6 * s;
        const px = Sa.x + lx * ca - ly * sa, py = Sa.y + lx * sa + ly * ca;
        for (let i = 0; i < 5; i++) S.powder.push({ x: px + rand(-3, 3), y: py, vx: rand(-25, 25), vy: rand(30, 110), r: rand(1.1, 2.6), c: POWDER[(Math.random() * 4) | 0] });
      }
      if (Sa.t > 2.1) { Sa.mode = "away"; Sa.t = 0; }
    } else if (Sa.mode === "away") { Sa.t += dt; Sa.x += 520 * dt; Sa.y -= 160 * dt; Sa.rot += 4 * dt; if (Sa.t > 0.8) { S.sachet = null; if (S.step === 4) setStep(5); return; } }
    const torn = Sa.mode !== "float";
    k.save(); k.translate(Sa.x, Sa.y + (Sa.mode === "float" ? Math.sin(t * 0.003) * 5 : 0)); k.rotate(Sa.rot);
    k.fillStyle = "rgba(0,0,0,.25)"; k.beginPath(); k.ellipse(0, sh / 2 + 8, sw * 0.4, 4, 0, 0, 6.283); k.fill();
    k.beginPath();
    if (torn) { k.moveTo(-sw / 2, -sh / 2); k.lineTo(sw / 2 - 14 * s, -sh / 2); k.lineTo(sw / 2, -sh / 2 + 14 * s); k.lineTo(sw / 2, sh / 2); k.lineTo(-sw / 2, sh / 2); k.closePath(); }
    else { k.rect(-sw / 2, -sh / 2, sw, sh); }
    const g = k.createLinearGradient(-sw / 2, 0, sw / 2, 0); g.addColorStop(0, "#ff5c85"); g.addColorStop(0.5, "#ff8fab"); g.addColorStop(1, "#e24d76");
    k.fillStyle = g; k.fill();
    k.save(); k.clip();
    k.fillStyle = "#ffd166"; k.fillRect(-sw / 2, -7 * s, sw, 14 * s);
    k.fillStyle = "rgba(255,255,255,.25)";
    for (let x = -sw / 2; x < sw / 2; x += 6) { k.beginPath(); k.moveTo(x, -sh / 2); k.lineTo(x + 3, -sh / 2 + 4); k.lineTo(x + 6, -sh / 2); k.fill(); }
    if (!torn) { k.setLineDash([3, 3]); k.strokeStyle = "rgba(255,255,255,.8)"; k.lineWidth = 1; k.beginPath(); k.moveTo(sw / 2 - 18 * s, -sh / 2); k.lineTo(sw / 2, -sh / 2 + 18 * s); k.stroke(); k.setLineDash([]); }
    k.restore();
    k.fillStyle = "#26203d"; k.font = `800 ${Math.round(10 * s)}px 'Bricolage Grotesque', sans-serif`; k.textAlign = "center"; k.textBaseline = "middle"; k.fillText("MASALA", 0, 0.5);
    k.fillStyle = "#fff6ee"; k.font = `700 ${Math.round(8 * s)}px 'Bricolage Grotesque', sans-serif`; k.fillText("of memories", 0, sh / 2 - 9 * s);
    k.restore();
    if (Sa.mode === "float" && S.step === 4) pulseRing(Sa.x, Sa.y, sw * 0.62, t);
  }

  function drawJug(x, y, a, js, h, fill, t) {
    const tw = js * 0.78, bw = js * 0.92, r = js * 0.12;
    const body = () => { k.beginPath(); k.moveTo(-tw / 2 - js * 0.14, -h / 2 - js * 0.03); k.lineTo(-tw / 2, -h / 2 + js * 0.12); k.lineTo(-bw / 2, h / 2 - r); k.quadraticCurveTo(-bw / 2, h / 2, -bw / 2 + r, h / 2); k.lineTo(bw / 2 - r, h / 2); k.quadraticCurveTo(bw / 2, h / 2, bw / 2, h / 2 - r); k.lineTo(tw / 2, -h / 2); k.closePath(); };
    k.save(); k.translate(x, y); k.rotate(a);
    body(); k.fillStyle = "rgba(210,235,255,.10)"; k.fill();
    k.save(); body(); k.clip(); k.rotate(-a);
    const top = -h * 0.5 * Math.cos(a), bottom = h * 0.5 * Math.cos(a) + Math.abs(Math.sin(a)) * bw * 0.5, ys = bottom - (bottom - top) * fill * 0.82;
    const wg = k.createLinearGradient(0, ys, 0, bottom); wg.addColorStop(0, "rgba(150,210,245,.78)"); wg.addColorStop(1, "rgba(70,140,200,.85)");
    k.fillStyle = wg; k.fillRect(-js * 2, ys, js * 4, js * 4);
    const wob = Math.sin(t * 0.006) * 1.4;
    k.strokeStyle = "rgba(255,255,255,.75)"; k.lineWidth = 2; k.beginPath(); k.moveTo(-js * 2, ys + wob); k.lineTo(js * 2, ys - wob); k.stroke();
    for (let i = 0; i < 4; i++) { const by = bottom - ((t * 0.05 + i * 23) % Math.max(1, bottom - ys)); k.fillStyle = "rgba(255,255,255,.5)"; k.beginPath(); k.arc(-js * 0.15 + i * js * 0.1, by, 1.6, 0, 6.283); k.fill(); }
    k.restore();
    body(); k.strokeStyle = "rgba(235,245,255,.8)"; k.lineWidth = 2.5; k.stroke();
    k.strokeStyle = "rgba(255,255,255,.45)"; k.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) { const yy = h / 2 - h * 0.22 * i; k.beginPath(); k.moveTo(bw * 0.18, yy); k.lineTo(bw * 0.34, yy); k.stroke(); }
    k.strokeStyle = "rgba(255,255,255,.38)"; k.lineWidth = 3; k.lineCap = "round"; k.beginPath(); k.moveTo(-tw * 0.3, -h * 0.3); k.lineTo(-bw * 0.34, h * 0.3); k.stroke();
    k.strokeStyle = "rgba(235,245,255,.75)"; k.lineWidth = js * 0.07; k.beginPath(); k.moveTo(tw / 2 - 2, -h * 0.32); k.bezierCurveTo(tw / 2 + js * 0.42, -h * 0.34, tw / 2 + js * 0.4, h * 0.22, bw / 2 - 2, h * 0.24); k.stroke();
    k.restore();
  }

  function updateJug(t, dt) {
    const J = S.jug, { cx, rx, rimY, pw } = G, js = pw * 0.42, h = js * 1.1;
    const hx = cx + rx * 0.55 + js * 0.35, hy = Math.min(rimY - h * 0.9 - 10, Math.max(G.uiB + h * 0.6 + 10, rimY - pw * 0.82));
    const ox = W + js * 1.2, oy = hy - 90;
    J.t += dt; let x = hx, y = hy, a = 0, flow = 0;
    if (J.mode === "in") { const e = easeOut(J.t / 0.8); x = ox + (hx - ox) * e; y = oy + (hy - oy) * e - Math.sin(e * Math.PI) * 30; a = 0.15 * (1 - e); if (J.t >= 0.8) { J.mode = J.want ? "pour" : "wait"; J.t = 0; } }
    else if (J.mode === "wait") { y = hy + Math.sin(t * 0.003) * 4; a = Math.sin(t * 0.002) * 0.04; pulseRing(hx, hy, js * 0.75, t); }
    else if (J.mode === "pour") {
      const p = J.t;
      a = -1.0 * ease(clamp(p / 0.5)) - 0.3 * smooth(0.5, 2.4, p) + 1.3 * smooth(2.4, 2.8, p);
      flow = smooth(0.25, 0.55, p) * (1 - smooth(2.15, 2.45, p));
      if (p >= 2.8) { J.mode = "out"; J.t = 0; }
    } else if (J.mode === "out") { const e = ease(clamp(J.t / 0.6)); x = hx + (ox - hx) * e; y = hy + (oy - hy) * e; a = 0.12 * e; if (J.t >= 0.6) { S.jug = null; if (S.step === 2) setStep(3); return; } }
    S.water = clamp(S.water + (dt * flow) / 1.75); J.fill = clamp(1 - S.water * 0.85);
    const ca = Math.cos(a), sa = Math.sin(a), lx = -js * 0.5, ly = -h * 0.52, sx = x + lx * ca - ly * sa, sy = y + lx * sa + ly * ca;
    if (flow > 0.02) {
      const surf = surfY() - 2, tx = cx - rx * 0.02, vy0 = -(90 + 70 * flow) * (pw / 300);
      const T = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * 2200 * Math.max(10, surf - sy))) / 2200, vx = (tx - sx) / T;
      const pts = [];
      for (let i = 0; i <= 18; i++) { const q = (T * i) / 18; pts.push([sx + vx * q + Math.sin(i * 0.9 + t * 0.025) * 1.3 * (i / 18), sy + vy0 * q + 0.5 * 2200 * q * q]); }
      const w = (3 + 7 * flow) * (pw / 300);
      const taper = (col, mult) => { k.strokeStyle = col; for (let i = 1; i < pts.length; i++) { k.lineWidth = w * mult * (1 - (0.45 * i) / 18); k.beginPath(); k.moveTo(pts[i - 1][0], pts[i - 1][1]); k.lineTo(pts[i][0], pts[i][1]); k.stroke(); } };
      k.lineCap = "round"; taper("rgba(120,185,230,.5)", 1.5); taper("rgba(175,220,250,.92)", 1);
      k.save(); k.translate(-w * 0.2, 0); k.beginPath(); k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.strokeStyle = "rgba(255,255,255,.75)"; k.lineWidth = Math.max(1, w * 0.22); k.stroke(); k.restore();
      const ix = pts[18][0];
      if (Math.random() < 0.9 * flow) for (let i = 0; i < 3; i++) S.drops.push({ x: ix + rand(-4, 4), y: surf, vx: rand(-110, 110), vy: -rand(90, 260) * flow, r: rand(1.3, 2.6), c: "200,232,250", l: 1 });
      if (Math.random() < 0.22 * flow) S.ripples.push({ x: ix, r: 4, a: 0.6 });
      if (Math.random() < 0.5 * flow) S.foam.push({ x: ix + rand(-12, 12), dy: rand(-3, 3), r: rand(2, 5), a: 0.55 });
      if (Math.random() < 0.3 * flow) S.drops.push({ x: sx + rand(-3, 3), y: sy, vx: vx + rand(-20, 20), vy: rand(0, 60), r: 1.8, c: "200,232,250", l: 1 });
    }
    drawJug(x, y, a, js, h, J.fill, t);
  }

  function drawSpoon(t) {
    const { cx, rx, ry, pw } = G, sy = surfY(), s = G.s;
    const ang = S.spoonAng, tx = cx + Math.cos(ang) * rx * 0.48, ty = sy + Math.sin(ang) * ry * 0.48;
    const ex = tx + pw * 0.2 + Math.cos(ang) * pw * 0.05, ey = ty - pw * 0.62;
    // submerged head
    k.save(); surfaceClip();
    k.translate(tx, ty); k.rotate(Math.atan2(ey - ty, ex - tx) + Math.PI / 2);
    k.fillStyle = "rgba(170,115,60,.55)"; k.beginPath(); k.ellipse(0, 6 * s, 11 * s, 16 * s, 0, 0, 6.283); k.fill();
    k.restore();
    // ripples where the spoon cuts the water
    if (Math.abs(S.stirVel) > 1 && Math.random() < 0.3) S.ripples.push({ x: tx, r: 3, a: 0.35 });
    // tapered wooden handle
    const dx = ex - tx, dy = ey - ty, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, w0 = 4 * s, w1 = 6.5 * s;
    const g = k.createLinearGradient(tx + nx * w1, ty + ny * w1, tx - nx * w1, ty - ny * w1);
    g.addColorStop(0, "#c88a4a"); g.addColorStop(0.5, "#a86c34"); g.addColorStop(1, "#7a4c22");
    k.fillStyle = g; k.beginPath();
    k.moveTo(tx + nx * w0, ty + ny * w0); k.lineTo(ex + nx * w1, ey + ny * w1);
    k.arc(ex, ey, w1, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
    k.lineTo(tx - nx * w0, ty - ny * w0); k.closePath(); k.fill();
    k.strokeStyle = "rgba(255,225,180,.35)"; k.lineWidth = 1.5; k.beginPath(); k.moveTo(tx + nx * w0 * 0.4, ty + ny * w0 * 0.4); k.lineTo(ex + nx * w1 * 0.4, ey + ny * w1 * 0.4); k.stroke();
    k.fillStyle = "rgba(255,255,255,.35)"; k.beginPath(); k.ellipse(tx, ty, 6 * s, 2.5 * s, 0, 0, 6.283); k.fill();
    // a hint arrow circling the pot until she starts stirring
    if (S.step === 5 && S.stir < 0.15) {
      const p = (t / 1400) % 1;
      k.save(); k.strokeStyle = `rgba(255,209,102,${0.75 - p * 0.3})`; k.lineWidth = 3; k.setLineDash([8, 9]); k.lineDashOffset = -t * 0.04;
      k.beginPath(); k.ellipse(cx, G.rimY, rx * 1.2, ry * 1.9, 0, Math.PI * 0.15, Math.PI * 1.75); k.stroke(); k.setLineDash([]);
      const ea = Math.PI * 1.75, ax = cx + Math.cos(ea) * rx * 1.2, ay = G.rimY + Math.sin(ea) * ry * 1.9;
      k.fillStyle = "rgba(255,209,102,.85)"; k.beginPath(); k.moveTo(ax + 9, ay + 2); k.lineTo(ax - 4, ay - 8); k.lineTo(ax - 4, ay + 9); k.closePath(); k.fill();
      k.restore();
    }
  }

  /* ---------- main loop ---------- */
  let paused = false;
  function frame(t) {
    if (!alive) return;
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    if (!paused) render(t, dt);
    requestAnimationFrame(frame);
  }
  function render(t, dt) {
    G.uiB = getUIB();
    G.lvl = G.ry * 0.55 * (1 - S.water) - S.boil * Math.sin(t * 0.01) * 0.8;
    const { cx, rx, ry, rimY } = G, sy = surfY();
    k.clearRect(0, 0, W, H);

    S.glow += ((S.stove ? 1 : 0) - S.glow) * 0.05;
    if (S.stove) { S.ignite += dt; S.knob += (1 - S.knob) * Math.min(1, dt * 10); }
    if (S.step === 1 && S.stove && S.ignite > 1.1) setStep(2);

    drawStove(t);
    drawPot(t);
    drawWater(t);
    // chunks sinking under the surface
    k.save(); surfaceClip();
    S.sinking = S.sinking.filter((c) => {
      c.t += dt; c.y = sy + c.t * 16; c.r += c.vr * dt * 0.2; c.sc = 1 - c.t * 0.3;
      if (c.t > 0.9) { S.potNoodles = clamp(S.potNoodles + 0.25); return false; }
      drawChunk(c, (1 - c.t / 0.9) * 0.9, true);
      return true;
    });
    k.restore();
    if (S.step === 3 && !S.cake && !S.chunks.length && !S.sinking.length && S.potNoodles >= 0.99) setStep(4);
    drawPotNoodles(t);

    // bubbles and boiling
    if (S.stove && S.water > 0.9 && Math.random() < 0.25 + S.boil * 0.7) { const a = rand(0, 6.283), r = Math.sqrt(Math.random()) * 0.85; S.bubbles.push({ x: cx + Math.cos(a) * r * rx * 0.9, y: sy + Math.sin(a) * r * ry * 0.75, r: 0, max: rand(2, 6 + S.boil * 5) }); }
    S.bubbles = S.bubbles.filter((b) => {
      b.r += 0.25 + S.boil * 0.35; if (b.r > b.max) { if (S.boil && Math.random() < 0.3) S.drops.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: -rand(60, 140), r: 1.2, c: "255,240,220", l: 1 }); return false; }
      k.strokeStyle = "rgba(255,255,255,.6)"; k.lineWidth = 1.2; k.beginPath(); k.arc(b.x, b.y, b.r, 0, 6.283); k.stroke(); return true;
    });
    if (S.boil && Math.random() < 0.5) { const a = rand(0, 6.283); S.foam.push({ x: cx + Math.cos(a) * rx * 0.85, dy: Math.sin(a) * ry * 0.7, r: rand(2, 4), a: 0.45 }); }

    k.strokeStyle = "#d8dee5"; k.lineWidth = 5; k.beginPath(); k.ellipse(cx, rimY, rx, ry, 0, 0, 6.283); k.stroke();
    k.strokeStyle = "rgba(255,255,255,.35)"; k.lineWidth = 1.5; k.beginPath(); k.ellipse(cx, rimY - 1.5, rx - 1, ry - 1, 0, Math.PI * 1.1, Math.PI * 1.6); k.stroke();

    // stirring physics
    if (!S.dragging) S.spoonAng += S.stirVel * dt;
    S.stirAng += S.stirVel * dt * 0.85;
    S.stirVel *= 1 - Math.min(1, 2.2 * dt);
    if (S.step === 6) S.stirAng += dt * 0.6;
    if (S.spoon) drawSpoon(t);

    if (S.jug) updateJug(t, dt);

    // the noodle cake
    if (S.cake) {
      const C = S.cake;
      if (C.mode === "float") { C.y = floatY(G.ch + G.cd) + Math.sin(t * 0.003) * 6; C.rot = Math.sin(t * 0.002) * 0.05; drawCakeAt(G.cx, C.y, C.rot, 0); if (S.step === 3) pulseRing(G.cx, C.y, G.cw * 0.62, t); }
      else {
        C.t += dt; const p = clamp(C.t / 0.45);
        drawCakeAt(G.cx, C.y, C.rot, 2.5 * p); drawCrack(G.cx, C.y, C.rot, p);
        if (C.t > 0.55) splitCake();
      }
    }
    S.chunks = S.chunks.filter((c) => {
      c.vy += GRAV * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt;
      if (c.vy > 0 && c.y > sy - 4 && inPot(c.x)) {
        for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; S.drops.push({ x: c.x + Math.cos(a) * 10, y: sy, vx: Math.cos(a) * rand(50, 140), vy: -rand(170, 340), r: rand(1.5, 3), c: "200,232,250", l: 1 }); }
        S.ripples.push({ x: c.x, r: 6, a: 0.75 }, { x: c.x, r: 1, a: 0.5 });
        for (let i = 0; i < 6; i++) S.foam.push({ x: c.x + rand(-14, 14), dy: rand(-3, 3), r: rand(2, 5), a: 0.6 });
        noise(0.3, "lowpass", 800, 0.35, 300);
        S.sinking.push({ ...c, t: 0 });
        return false;
      }
      drawChunk(c);
      return true;
    });
    S.crumbs = S.crumbs.filter((p) => {
      p.vy += GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.vy > 0 && p.y > sy) { if (Math.random() < 0.3) S.ripples.push({ x: p.x, r: 1, a: 0.3 }); return false; }
      k.save(); k.translate(p.x, p.y); k.rotate(p.r); k.strokeStyle = "#e9b23a"; k.lineWidth = 2; k.lineCap = "round";
      k.beginPath(); for (let i = 0; i <= 4; i++) { const x = -5 + i * 2.5, y = Math.sin(i * 1.6) * 1.6; i ? k.lineTo(x, y) : k.moveTo(x, y); } k.stroke(); k.restore();
      return true;
    });

    // masala packet + powder
    if (S.sachet) drawSachet(t, dt);
    S.powder = S.powder.filter((p) => {
      p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > sy && inPot(p.x)) {
        S.masala = clamp(S.masala + 0.0022);
        if (Math.random() < 0.08) { const [u, v] = screenToPot(p.x, p.y); S.blooms.push({ u, v, r: 0.02, max: rand(0.18, 0.34), a: 0.55 }); }
        if (Math.random() < 0.04) S.steam.push({ x: p.x, y: sy - 3, r: rand(3, 6), vy: rand(0.2, 0.5), a: 0.12, life: 0, col: "230,140,70" });
        return false;
      }
      k.fillStyle = p.c; k.beginPath(); k.arc(p.x, p.y, p.r, 0, 6.283); k.fill();
      return true;
    });

    // droplets
    S.drops = S.drops.filter((d) => {
      d.vy += GRAV * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt * 1.2;
      if ((d.vy > 0 && d.y > sy + 2) || d.l <= 0) return false;
      k.fillStyle = `rgba(${d.c},${Math.max(0, d.l)})`; k.beginPath(); k.arc(d.x, d.y, d.r, 0, 6.283); k.fill();
      return true;
    });

    // steam
    if (S.stove && S.water > 0.5 && Math.random() < (0.1 + S.boil * 0.22) * dt * 60) S.steam.push({ x: cx + rand(-rx * 0.6, rx * 0.6), y: rimY - 4, r: rand(6, 12), vy: rand(0.5, 1.2), a: rand(0.035, 0.075), life: 0 });
    S.steam = S.steam.filter((s) => {
      s.life++; s.y -= s.vy; s.r += 0.3; s.x += Math.sin((s.life + s.y) * 0.03) * 0.6;
      const a = s.a * Math.sin(Math.PI * Math.min(1, s.life / 170));
      if (s.life > 170) return false; if (a <= 0) return false;
      k.fillStyle = `rgba(${s.col || "255,246,238"},${a})`; k.beginPath(); k.arc(s.x, s.y, s.r, 0, 6.283); k.fill(); return true;
    });

    // the noodles fly out and spell her name
    if (S.reveal) {
      const R = S.reveal, el = (t - R.t0) / 1000, lw = R.L.lw, dur = reduce ? 0.01 : 2.4; let all = true;
      R.noodles.forEach((nd, i) => {
        const pts = nd.start.map((s, j) => {
          const p = ease(clamp((el - nd.delay - j * 0.006) / dur)); if (p < 1) all = false;
          const tg = nd.target[j];
          return [s[0] + (tg[0] - s[0]) * p, s[1] + (tg[1] - s[1]) * p - Math.sin(Math.PI * p) * H * 0.22 * nd.lift];
        });
        const prog = clamp((el - nd.delay) / dur);
        k.save(); if (prog > 0.9) { k.shadowColor = "rgba(255,209,102,.55)"; k.shadowBlur = 14; }
        drawNoodle(pts, lw, lw * (1 - prog * 0.55), i * 1.7, t); k.restore();
      });
      if (all && !R.done) {
        R.done = true;
        const L = R.L, r = cv.getBoundingClientRect();
        cb.onReveal(L.top + L.unit + 26);
        burst(r.left + W / 2, r.top + L.top + L.unit / 2, 220, 9);
        setTimeout(() => burst(r.left + W * 0.2, r.top + L.top, 80), 300);
        setTimeout(() => burst(r.left + W * 0.8, r.top + L.top, 80), 500);
      }
    }
  }

  /* ---------- steps ---------- */
  function setStep(n) {
    S.step = n; S.busy = false;
    cv.style.touchAction = n === 5 ? "none" : "pan-y";
    if (n === 2) S.jug = { mode: "in", t: 0, fill: 1 };
    if (n === 3) S.cake = { mode: "float", t: 0, y: 0, rot: 0 };
    if (n === 4) S.sachet = { mode: "float", t: 0, x: 0, y: 0, rot: 0 };
    if (n === 5) S.spoon = true;
    cb.onStep(n);
    if (n === 6) runTimer();
  }
  function doStep() {
    if (S.step === 0) { setStep(1); return; }
    if (S.busy) return;
    if (S.step === 1) { S.busy = true; S.stove = true; S.ignite = 0; blip(220); noise(0.7, "lowpass", 900, 0.45, 200); }
    else if (S.step === 2 && S.jug) { S.busy = true; if (S.jug.mode === "wait") { S.jug.mode = "pour"; S.jug.t = 0; } else S.jug.want = true; setTimeout(() => noise(2, "lowpass", 900, 0.4, 500), 300); }
    else if (S.step === 3 && S.cake && S.cake.mode === "float") { S.busy = true; breakCake(); }
    else if (S.step === 4 && S.sachet && S.sachet.mode === "float") {
      S.busy = true; S.sachet.mode = "tear"; S.sachet.t = 0; noise(0.3, "bandpass", 1300, 0.35);
    }
    else if (S.step === 5) { S.stirVel += 5; addStir(0.12); }
  }
  function addStir(v) {
    if (S.step !== 5) return;
    S.stir = clamp(S.stir + v); cb.onStir(S.stir);
    if (Math.random() < 0.3) noise(0.15, "bandpass", 700, 0.08);
    if (S.stir >= 1) { S.step = 5.5; setTimeout(() => setStep(6), 500); }
  }
  function runTimer() {
    const t0 = performance.now(), dur = reduce ? 300 : 5200; S.boil = 1;
    (function f(now) {
      if (!alive) return;
      const p = clamp((now - t0) / dur), left = Math.ceil(120 * (1 - p));
      cb.onTimer(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`);
      if (p < 1) requestAnimationFrame(f); else serve();
    })(t0);
  }
  function serve() {
    ding(); S.spoon = false; cb.onStep(7);
    for (let i = 0; i < 26; i++) S.steam.push({ x: G.cx + rand(-G.rx, G.rx), y: G.rimY - rand(0, 30), r: rand(10, 20), vy: rand(1, 2.4), a: rand(0.07, 0.13), life: 0 });
    noise(0.9, "bandpass", 900, 0.25, 300);
    S.reveal = { t0: performance.now(), noodles: tangles.map((tg, i) => ({ start: tg.map(potToScreen), target: null, delay: i * 0.045, lift: rand(0.6, 1.1) })), done: false };
    buildTargets(S.reveal.noodles); S.potNoodles = 0;
  }

  /* ---------- input ---------- */
  let lastA = null, lastTs = 0;
  const angleAt = (e) => Math.atan2((e.offsetY - surfY()) / G.ry, (e.offsetX - G.cx) / G.rx);
  const down = (e) => { if (S.step === 5) { S.dragging = true; lastA = angleAt(e); lastTs = performance.now(); S.spoonAng = lastA; cv.setPointerCapture(e.pointerId); } };
  const move = (e) => {
    if (!S.dragging || S.step !== 5) return;
    const a = angleAt(e), now = performance.now(); let d = a - lastA;
    if (d > Math.PI) d -= 6.283; if (d < -Math.PI) d += 6.283;
    const vel = clamp(d / Math.max(0.008, (now - lastTs) / 1000), -14, 14);
    S.stirVel = S.stirVel * 0.6 + vel * 0.4; S.spoonAng = a; lastA = a; lastTs = now;
    addStir(Math.abs(d) / (6.283 * 2.2));
  };
  const up = () => { S.dragging = false; };
  const click = () => { if ([1, 2, 3, 4].includes(S.step)) doStep(); };
  cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("click", click);

  geo(); requestAnimationFrame(frame);
  return {
    doStep,
    resize: geo,
    reset() { S = fresh(); makeTangles(); cb.onStep(0); cb.onStir(0); },
    // Test hook (only wired up on a #debug link): fast-forward the scene frame by frame.
    debug: {
      get S() { return S; }, setStep,
      advance(sec, t0 = performance.now()) { paused = true; const n = Math.round(sec * 60); for (let i = 0; i < n; i++) render(t0 + (i * 1000) / 60, 1 / 60); }
    },
    destroy() {
      alive = false;
      cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", up); cv.removeEventListener("click", click);
    }
  };
}
