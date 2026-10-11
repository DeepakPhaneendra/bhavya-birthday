import { useEffect, useRef, useState } from "react";
import { useReveal } from "../lib/useReveal.js";
import { reduce } from "../lib/util.js";
import { ding } from "../lib/sound.js";
import { burstAt } from "../lib/confetti.js";
import { makeCatcher } from "../engine/catcher.js";
import { REEL_MSGS } from "../data.js";
import Heading from "./Heading.jsx";

// Act 4: a game. Reels rain down; catch 12 in the Maggi bowl.
export default function Catcher() {
  const ref = useReveal(), cvRef = useRef(null), eng = useRef(null), boxRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const e = makeCatcher(cvRef.current, {
      onCatch: (s, type) => {
        setScore(s);
        if (type === "start") return;
        const id = Math.random(), msg = REEL_MSGS[Math.max(0, s - 1)];
        if (type === "cloud") setToast({ id, cls: "bad", text: "A Monday cloud. −1. Mondays are the worst." });
        else if (type === "gold") setToast({ id, cls: "gold", text: "Golden reel! +2. " + msg });
        else setToast({ id, cls: "", text: msg });
      },
      onWin: () => { setPhase("won"); ding(); setTimeout(() => burstAt(boxRef.current, 240, 0.4), 100); }
    });
    eng.current = e;
    const r = () => e.resize();
    addEventListener("resize", r);
    return () => { removeEventListener("resize", r); e.destroy(); };
  }, []);

  const start = () => {
    boxRef.current.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    setPhase("play"); setToast(null); eng.current.start();
  };

  return (
    <section className="act" id="reels" ref={ref}>
      <div className="wrap">
        <Heading eyebrow="Act four · a game" title="Catch the reels." lede="It all started with reels. Now they’re raining. Catch 12 in your Maggi bowl and see what happens. Dodge the Monday clouds." />
        <div className="game rv" style={{ "--d": 3 }} ref={boxRef}>
          <canvas ref={cvRef} style={{ touchAction: phase === "play" ? "none" : "pan-y" }} aria-label="Reel catching game. Move the bowl with your finger, mouse or arrow keys." />
          <div className="hud">
            <div className="slots" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i < score ? "on" : ""} />)}</div>
            <span className="count" aria-live="polite">{score}/12</span>
          </div>
          {toast && phase === "play" && <div key={toast.id} className={"toast " + toast.cls}>{toast.text}</div>}
          {phase === "idle" && (
            <div className="overlay"><div>
              <h3>Ready?</h3>
              <p>Move the bowl with your finger, mouse or the arrow keys.</p>
              <div className="legend">
                <span><i style={{ background: "linear-gradient(160deg,#ff6f91,#c3b5ff)" }} />Reel +1</span>
                <span><i style={{ background: "linear-gradient(160deg,#fff1b8,#ffb627)" }} />Golden +2</span>
                <span><i style={{ background: "#59607e", borderRadius: "50%", width: 16, height: 12 }} />Monday −1</span>
              </div>
              <button className="btn pink" onClick={start}>Start catching</button>
            </div></div>
          )}
          {phase === "won" && (
            <div className="overlay won"><div>
              <h3>12 out of 12!</h3>
              <p className="big">You caught every reel I ever sent you. And somewhere along the way, you caught a best friend too.</p>
              <button className="btn ghost" onClick={start}>Play again</button>
            </div></div>
          )}
        </div>
        <p className="game-hint">Tip: golden reels count double.</p>
      </div>
    </section>
  );
}
