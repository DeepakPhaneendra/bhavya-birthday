import { useEffect, useRef, useState } from "react";
import { useReveal } from "../lib/useReveal.js";
import { clamp } from "../lib/util.js";
import { STORY } from "../data.js";
import Heading from "./Heading.jsx";

// Act 3: a noodle that draws itself down the page as she scrolls, lighting each chapter.
export default function Story() {
  const ref = useReveal(), tl = useRef(null), svg = useRef(null), p0 = useRef(null), p1 = useRef(null), p2 = useRef(null);
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    let len = 0;
    const draw = () => {
      if (!tl.current) return;
      const r = tl.current.getBoundingClientRect(), prog = clamp((innerHeight * 0.7 - r.top) / r.height);
      [p1, p2].forEach((p) => (p.current.style.strokeDashoffset = len * (1 - prog)));
      let l = -1;
      tl.current.querySelectorAll(".tl-item").forEach((it, i) => { if (it.getBoundingClientRect().top < innerHeight * 0.7) l = i; });
      setLit(l);
    };
    const build = () => {
      if (!tl.current) return;
      const h = tl.current.offsetHeight, sw = svg.current.getBoundingClientRect().width || 70, mid = sw / 2 - 4, k2 = sw / 70;
      svg.current.setAttribute("viewBox", `0 0 ${sw} ${h}`); svg.current.style.height = h + "px";
      let d = `M${mid} 25`;
      for (let y = 25; y <= h; y += 6) d += ` L${mid + (Math.sin(y / 16) * 7 + Math.sin(y / 61) * 10) * k2} ${y}`;
      [p0, p1, p2].forEach((p) => p.current.setAttribute("d", d));
      len = p1.current.getTotalLength();
      [p1, p2].forEach((p) => (p.current.style.strokeDasharray = len));
      draw();
    };
    build();
    document.fonts?.ready.then(build);
    addEventListener("scroll", draw, { passive: true }); addEventListener("resize", build);
    return () => { removeEventListener("scroll", draw); removeEventListener("resize", build); };
  }, []);

  return (
    <section className="act" id="story" ref={ref}>
      <div className="wrap">
        <Heading eyebrow="Act three" title="One noodle. One long story." lede="Scroll, and watch the noodle connect everything." />
        <div className="timeline" ref={tl}>
          <svg className="tl-svg" ref={svg} aria-hidden="true">
            <path ref={p0} fill="none" stroke="rgba(255,246,238,.08)" strokeWidth="8" />
            <path ref={p1} fill="none" stroke="#d99a22" strokeWidth="9" strokeLinecap="round" />
            <path ref={p2} fill="none" stroke="rgba(255,231,163,.85)" strokeWidth="3" strokeLinecap="round" transform="translate(-1.5,-1)" />
          </svg>
          {STORY.map(([h, p, q], i) => (
            <div key={i} className={"tl-item rv" + (i <= lit ? " lit" : "")} style={{ "--d": 2 + i }}>
              <span className="n">{i + 1}</span>
              <h3>{h}</h3>
              <p>{p}</p>
              {q && <p className="q">{q}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
