import { useEffect, useRef, useState } from "react";
import { fitCanvas, rand, reduce } from "../lib/util.js";
import { blip, noise } from "../lib/sound.js";
import { NoodleMark } from "./Heading.jsx";

// Act 6: blow out the candles; three fireworks burst and their sparks spell her name.
export default function Wish() {
  const cvRef = useRef(null), secRef = useRef(null), eng = useRef(null);
  const [out, setOut] = useState(() => Array(7).fill(false));
  const [done, setDone] = useState(false);
  const [again, setAgain] = useState(false);
  const left = out.filter((v) => !v).length;

  useEffect(() => {
    const cv = cvRef.current;
    let SW, SH, sx, stars = [], rockets = [], dots = [], on = false, alive = true;
    const size = () => { [SW, SH, sx] = fitCanvas(cv); stars = Array.from({ length: 110 }, () => ({ x: rand(0, SW), y: rand(0, SH * 0.7), s: rand(0.3, 1.5), p: rand(0, 6.28) })); };
    const textPoints = (lines) => {
      const w = Math.floor(SW), h = Math.floor(SH), oc = document.createElement("canvas");
      oc.width = w; oc.height = h;
      const o = oc.getContext("2d", { willReadFrequently: true }), pts = [];
      lines.forEach(({ txt, size, y }) => {
        o.clearRect(0, 0, w, h); o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
        o.font = `${size}px 'Bagel Fat One', sans-serif`; o.fillText(txt, w / 2, y);
        const data = o.getImageData(0, 0, w, h).data, step = Math.max(3, Math.round(size / 18));
        for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) if (data[(yy * w + xx) * 4 + 3] > 128) pts.push([xx, yy, txt]);
      });
      return pts;
    };
    const loop = (t) => {
      if (!alive || !on) return;
      sx.globalCompositeOperation = "destination-out"; sx.fillStyle = "rgba(0,0,0,.28)"; sx.fillRect(0, 0, SW, SH);
      sx.globalCompositeOperation = "source-over";
      for (const s of stars) { sx.fillStyle = `rgba(255,246,238,${0.25 + 0.5 * Math.abs(Math.sin(t / 1000 + s.p))})`; sx.fillRect(s.x, s.y, s.s, s.s); }
      rockets = rockets.filter((r) => {
        r.y += r.vy; r.vy *= 0.985;
        sx.fillStyle = "#ffe7a3"; sx.beginPath(); sx.arc(r.x, r.y, 2.4, 0, 6.283); sx.fill();
        if (r.y <= r.ty || r.vy > -1.5) { r.boom(); return false; }
        return true;
      });
      sx.globalCompositeOperation = "lighter";
      for (const d of dots) {
        if (d.home) { d.x += (d.tx - d.x) * 0.07; d.y += (d.ty - d.y) * 0.07; }
        else { d.x += d.vx; d.y += d.vy; d.vx *= 0.95; d.vy *= 0.95; d.vy += 0.03; if (--d.wait <= 0) d.home = true; }
        sx.fillStyle = d.c; sx.globalAlpha = 0.6 + 0.4 * Math.sin(t / 300 + d.p);
        sx.beginPath(); sx.arc(d.x, d.y, d.r, 0, 6.283); sx.fill();
      }
      sx.globalAlpha = 1; sx.globalCompositeOperation = "source-over";
      requestAnimationFrame(loop);
    };
    size(); addEventListener("resize", size);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !on) { on = true; requestAnimationFrame(loop); } else if (!e.isIntersecting) on = false;
    }));
    io.observe(secRef.current);
    eng.current = {
      launch() {
        const m = document.createElement("canvas").getContext("2d");
        const fit = (txt, size, maxW) => { m.font = `${size}px 'Bagel Fat One', sans-serif`; const w = m.measureText(txt).width; return w > maxW ? (size * maxW) / w : size; };
        const big = fit("BHAVYA", Math.min(SW * 0.2, 170), SW * 0.88), sm = fit("HAPPY BIRTHDAY", Math.min(SW * 0.075, 56), SW * 0.86);
        const pts = textPoints([{ txt: "HAPPY BIRTHDAY", size: sm, y: SH * 0.3 }, { txt: "BHAVYA", size: big, y: SH * 0.3 + sm * 0.9 + big * 0.6 }]);
        const groups = [[], [], []]; pts.forEach((p, i) => groups[i % 3].push(p));
        groups.forEach((grp, gi) => setTimeout(() => {
          const ox = SW * (0.25 + gi * 0.25), oy = SH * 0.35;
          rockets.push({ x: ox, y: SH, vy: -(SH * 0.022), ty: oy, boom() {
            noise(0.9, "lowpass", 600, 0.5, 120); blip(523 + gi * 130);
            grp.forEach(([tx, ty, txt]) => {
              const a = rand(0, 6.283), s = rand(1, 9), isName = txt === "BHAVYA";
              dots.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, tx, ty, wait: rand(25, 50), home: reduce, r: isName ? rand(1.6, 2.6) : rand(1.2, 1.8), p: rand(0, 6.28),
                c: isName ? (Math.random() < 0.7 ? "#ffd166" : "#ffe7a3") : Math.random() < 0.6 ? "#ff6f91" : "#fff6ee" });
            });
          } });
        }, gi * 500));
      },
      clear() { dots = []; rockets = []; sx.clearRect(0, 0, SW, SH); }
    };
    return () => { alive = false; io.disconnect(); removeEventListener("resize", size); };
  }, []);

  const blow = (i) => {
    if (out[i]) return;
    noise(0.35, "bandpass", 1200, 0.25, 600);
    const n = out.map((v, j) => (j === i ? true : v));
    setOut(n);
    if (n.every(Boolean)) setTimeout(() => { setDone(true); eng.current.launch(); setTimeout(() => setAgain(true), 4500); }, 700);
  };
  const reset = () => { eng.current.clear(); setOut(Array(7).fill(false)); setDone(false); setAgain(false); };

  return (
    <section className={"wish" + (done ? " done" : "")} id="wish" ref={secRef}>
      <canvas ref={cvRef} aria-hidden="true" />
      <div className="wish-ui">
        <p className="eyebrow"><NoodleMark />Act six</p>
        <h2 className="h2">Make a wish.</h2>
        <p className="sub">Close your eyes. Then tap each flame and look up.</p>
      </div>
      <div className="cake-area">
        <div className="cake">
          <div className="candles">
            {out.map((o, i) => (
              <button key={i} className={"candle" + (o ? " out" : "")} aria-label={"Blow out candle " + (i + 1)} onClick={() => blow(i)}>
                <span className="wick" /><span className="flame" /><span className="smoke" />
              </button>
            ))}
          </div>
          <div className="tier top" /><div className="tier bot">Bhavya</div><div className="plate" />
        </div>
        <p className="cake-msg" aria-live="polite">{left ? `${left} candle${left > 1 ? "s" : ""} to go` : "Now look up."}</p>
      </div>
      {again && <button className="btn ghost again-wish" onClick={reset}>Make another wish</button>}
    </section>
  );
}
