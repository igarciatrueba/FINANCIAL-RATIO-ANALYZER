"use client";

import { useEffect, useRef } from "react";

export function PremiumCursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return undefined;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let targetX = x;
    let targetY = y;
    let frame = 0;
    const onMove = (event: PointerEvent) => { targetX = event.clientX; targetY = event.clientY; };
    const update = () => {
      x += (targetX - x) * 0.045;
      y += (targetY - y) * 0.045;
      if (glowRef.current) glowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(update);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(update);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, []);

  return <div aria-hidden="true" className="premium-cursor-glow" ref={glowRef} />;
}
