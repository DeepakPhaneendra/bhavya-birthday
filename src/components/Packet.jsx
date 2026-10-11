import { useRef, useState } from "react";
import { useReveal } from "../lib/useReveal.js";
import { ding, noise } from "../lib/sound.js";
import { burstAt } from "../lib/confetti.js";
import { FROM, LETTER } from "../data.js";
import Heading from "./Heading.jsx";

// Act 7: a one-of-a-kind noodle packet; tearing it open releases the letter.
export default function Packet() {
  const ref = useReveal(), pkRef = useRef(null);
  const [torn, setTorn] = useState(false);
  const [show, setShow] = useState(false);
  const tear = () => {
    if (torn) return;
    setTorn(true); noise(0.5, "bandpass", 1300, 0.45); burstAt(pkRef.current, 110, 0.1);
    setTimeout(() => { setShow(true); ding(); }, 500);
  };
  return (
    <section className="act packet-sec" id="packet" ref={ref}>
      <div className="wrap">
        <Heading center eyebrow="Act seven" title="A special edition." lede="Only one packet like this exists in the world. There’s something inside." />
        <button className={"packet rv" + (torn ? " torn" : "")} style={{ "--d": 3 }} ref={pkRef} onClick={tear} aria-label="Tear open the noodle packet">
          <span className="pk-top" />
          <span className="pk-body">
            <span className="pk-ed">Limited birthday edition</span>
            <span className="pk-name">Bhavya</span>
            <span className="pk-sub">2-minute noodles</span>
            <span className="pk-small">Masala of memories · Net wt: one whole friendship</span>
            <span className="pk-badge">Made with<br />extra love</span>
          </span>
        </button>
        <p className="tear">{torn ? "Something fell out…" : "Tap to tear it open ✂"}</p>
        {show && (
          <article className="letter">
            <p className="to" style={{ "--i": 0 }}>Dear Bhavya,</p>
            {LETTER.map((p, i) => <p key={i} style={{ "--i": i + 1 }}>{p}</p>)}
            <p className="sig" style={{ "--i": LETTER.length + 1 }}>Always your best friend,<br />{FROM || "the stranger who cooked you Maggi"}</p>
          </article>
        )}
      </div>
    </section>
  );
}
