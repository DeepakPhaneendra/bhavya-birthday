import { useEffect, useRef } from "react";
import { clamp } from "../lib/util.js";

// A wavy noodle across the top that grows as she scrolls.
const D = "M0 7 " + Array.from({ length: 50 }, (_, i) => `Q${i * 20 + 5} ${i % 2 ? 12 : 2} ${i * 20 + 10} 7 T${i * 20 + 20} 7`).join(" ");

export default function Progress() {
  const ref = useRef(null);
  useEffect(() => {
    const p = ref.current, len = p.getTotalLength();
    p.style.strokeDasharray = `${len} ${len * 3}`;
    const f = () => { const h = document.documentElement.scrollHeight - innerHeight; p.style.strokeDashoffset = len * (1 - clamp(scrollY / (h || 1))); };
    f(); addEventListener("scroll", f, { passive: true }); addEventListener("resize", f);
    return () => { removeEventListener("scroll", f); removeEventListener("resize", f); };
  }, []);
  return (
    <div className="prog" aria-hidden="true">
      <svg viewBox="0 0 1000 14" preserveAspectRatio="none">
        <path ref={ref} d={D} fill="none" stroke="#ffd166" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
