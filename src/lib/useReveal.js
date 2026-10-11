import { useEffect, useRef } from "react";
import { reduce } from "./util.js";

// Sections already on screen stay put; ones further down float in when scrolled to.
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || el.getBoundingClientRect().top < innerHeight * 0.9) return;
    el.classList.add("pre");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { el.classList.remove("pre"); io.disconnect(); }
    }), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
