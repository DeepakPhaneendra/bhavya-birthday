export const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = typeof matchMedia !== "undefined" && matchMedia("(pointer: fine)").matches;
export const DPR = Math.min(window.devicePixelRatio || 1, 2);
export const COLS = ["#ffd166", "#ffe7a3", "#ff6f91", "#ffa36c", "#fff6ee", "#c3b5ff", "#ff9ec0"];

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
export const smooth = (e0, e1, v) => { const q = clamp((v - e0) / (e1 - e0)); return q * q * (3 - 2 * q); };

export function fitCanvas(cv) {
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, r.width * DPR);
  cv.height = Math.max(1, r.height * DPR);
  const c = cv.getContext("2d");
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  return [r.width, r.height, c];
}

export function lerpColor(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}

export function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}
