import { useEffect, useRef, useState } from "react";
import { useReveal } from "../lib/useReveal.js";
import { blip, noise } from "../lib/sound.js";
import { burstAt } from "../lib/confetti.js";
import { INGREDIENTS } from "../data.js";
import Heading from "./Heading.jsx";

// Act 2: a handwritten recipe card; ticking every ingredient stamps it.
export default function Recipe() {
  const ref = useReveal(), stampRef = useRef(null);
  const [on, setOn] = useState(() => INGREDIENTS.map(() => false));
  const all = on.every(Boolean);

  useEffect(() => {
    if (!all) return;
    noise(0.15, "lowpass", 300, 0.6);
    const t = setTimeout(() => burstAt(stampRef.current, 90), 250);
    return () => clearTimeout(t);
  }, [all]);

  const toggle = (i) => { blip(on[i] ? 440 : 880); setOn((o) => o.map((v, j) => (j === i ? !v : v))); };

  return (
    <section className="act" id="recipe" ref={ref}>
      <div className="wrap recipe-grid">
        <div>
          <Heading eyebrow="Act two" title="The recipe for us." lede="No cookbook has this one. I had to invent it. It started with a single packet of noodles and a girl I had never met." />
          <div className="facts rv" style={{ "--d": 3 }}>
            <span>Prep time <b>0 min</b> (we hadn’t even met)</span>
            <span>Cook time <b>“2 min”</b></span>
            <span>Serves <b>2, forever</b></span>
          </div>
        </div>
        <article className="card rv" style={{ "--d": 2 }}>
          <div className={"stamp" + (all ? " on" : "")} ref={stampRef}>Tested and<br />approved by<br />the universe</div>
          <h3>Bhavya &amp; Me</h3>
          <h4>Ingredients</h4>
          <ul className="ing">
            {INGREDIENTS.map((t, i) => (
              <li key={i}>
                <button className={on[i] ? "on" : ""} aria-pressed={on[i]} onClick={() => toggle(i)}>
                  <span className="box" /><span className="txt">{t}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="tickhint">{all ? "All in. Perfect." : "Tick every ingredient."}</p>
          <h4>Method</h4>
          <ol className="method">
            <li>Cook Maggi for a stranger. Don’t ask why. Trust the universe.</li>
            <li>Start sending reels. Never stop.</li>
            <li>Slowly stir in the past, every chapter from before.</li>
            <li>Add the feelings. Let it simmer at 2 AM.</li>
            <li>Serve hot: the world’s best best friends.</li>
          </ol>
          <p className="note">Chef’s note: tastes best on October 12.</p>
        </article>
      </div>
    </section>
  );
}
