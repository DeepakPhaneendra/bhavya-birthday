import { useReveal } from "../lib/useReveal.js";
import { Split } from "./Heading.jsx";

export default function Ending({ onReplay }) {
  const ref = useReveal();
  return (
    <section className="act ending" ref={ref}>
      <div className="wrap">
        <p className="was rv">It was supposed to take 2 minutes.</p>
        <p className="big"><Split text="It became" /><span><Split text="forever." /></span></p>
        <p className="sign rv" style={{ "--d": 3 }}>Happy birthday, Bhavya. Here’s to a lifetime of Maggi.</p>
        <button className="btn ghost rv" style={{ "--d": 4 }} onClick={onReplay}>Cook it again</button>
      </div>
    </section>
  );
}
