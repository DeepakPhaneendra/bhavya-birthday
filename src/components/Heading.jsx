// Section heading: noodle mark eyebrow, a title that rises letter by letter, and a lede.
export function NoodleMark() {
  return (
    <svg viewBox="0 0 34 10" aria-hidden="true">
      <path d="M1 5 Q5 0 9 5 T17 5 T25 5 T33 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Split({ text }) {
  let i = 0;
  const words = text.split(" ");
  return (
    <span className="split" aria-label={text}>
      {words.map((w, wi) => (
        <span className="w" aria-hidden="true" key={wi}>
          {[...w].map((ch, ci) => <span className="c" key={ci} style={{ "--i": i++ }}>{ch}</span>)}
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

export default function Heading({ eyebrow, title, lede, center }) {
  return (
    <div style={center ? { textAlign: "center", display: "grid", justifyItems: "center" } : undefined}>
      <p className="eyebrow rv"><NoodleMark />{eyebrow}</p>
      <h2 className="h2"><Split text={title} /></h2>
      {lede && <p className="lede rv" style={{ "--d": 2, marginInline: center ? "auto" : undefined }}>{lede}</p>}
    </div>
  );
}
