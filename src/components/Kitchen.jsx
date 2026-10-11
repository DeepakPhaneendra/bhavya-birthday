import { useEffect, useRef, useState } from "react";
import { makeKitchen } from "../engine/kitchen.js";
import { Sound, setSound } from "../lib/sound.js";
import { STEPS } from "../data.js";

// Act 1: she cooks the Maggi; the noodles fly out and spell her name.
export default function Kitchen({ round }) {
  const cvRef = useRef(null), uiRef = useRef(null), eng = useRef(null);
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState("2:00");
  const [stir, setStir] = useState(0);
  const [revealTop, setRevealTop] = useState(null);

  useEffect(() => {
    const e = makeKitchen(
      cvRef.current,
      () => uiRef.current.getBoundingClientRect().bottom - cvRef.current.getBoundingClientRect().top,
      { onStep: setStep, onTimer: setTimer, onStir: setStir, onReveal: setRevealTop }
    );
    eng.current = e;
    if (location.hash === "#debug") window.__kitchen = e;
    const r = () => e.resize();
    addEventListener("resize", r);
    return () => { removeEventListener("resize", r); e.destroy(); };
  }, []);

  useEffect(() => {
    if (round > 1) { eng.current.reset(); setRevealTop(null); }
  }, [round]);

  const st = STEPS[step];
  const click = () => {
    if (step === 0 && !Sound.on) setSound(true);
    eng.current.doStep();
  };

  return (
    <section className="kitchen" id="top" aria-label="Cook the Maggi">
      <canvas ref={cvRef} />
      <div className="k-ui" ref={uiRef}>
        {step === 0 ? (
          <div className="swap" key="intro">
            <p className="eyebrow">{round > 1 ? "Round two" : "October 12 · A true story"}</p>
            <h1>{round > 1 ? <>Cook it <em>again?</em></> : <>Before we ever met, I cooked you <em>Maggi.</em></>}</h1>
            <p className="sub">{round > 1 ? "Some recipes are worth repeating." : "Tonight it’s your turn. Cook it with me, step by step, and see what happens."}</p>
          </div>
        ) : (
          <div className="swap" key={"s" + step}>
            <p className="eyebrow">{st.eye}</p>
            {st.title && <h1>{st.title}</h1>}
            {st.sub && <p className="sub">{st.sub}</p>}
          </div>
        )}
        {step >= 1 && step <= 6 && (
          <div className="steps" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i < step ? "done" : ""} />)}
          </div>
        )}
        {step === 5 && <div className="stir-bar" aria-hidden="true"><span style={{ width: stir * 100 + "%" }} /></div>}
        {step === 6 && <p className="timer" aria-live="polite">{timer}</p>}
        {(step === 0 || st?.btn) && <button className="btn" onClick={click}>{step === 0 ? "Start cooking" : st.btn}</button>}
        {step === 0 && <p className="k-hint">Sound on, please. It matters.</p>}
      </div>
      {revealTop !== null && (
        <div className="k-reveal" style={{ top: revealTop + "px" }}>
          <p className="hb">Happy Birthday!</p>
          <p>Served hot by the stranger who cooked you Maggi.</p>
          <a href="#recipe">Scroll · the whole story is in this bowl ↓</a>
        </div>
      )}
    </section>
  );
}
