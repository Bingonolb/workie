"use client";

import { useEffect, useRef } from "react";

export function ParallaxCover({ src, gradient }: { src?: string | null; gradient?: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const onScroll = () => {
      // Clamp to 0 — scrollY is negative during iOS overscroll/pull-to-refresh
      const y = Math.max(0, window.scrollY);
      node.style.transform = `scale(1.15) translateY(${y * 0.25}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg = src
    ? `url(${src}) center / cover no-repeat`
    : (gradient ?? "linear-gradient(135deg, #8b5cf6, #f97316)");

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        ref={el}
        style={{
          position: "absolute",
          inset: "-20%",
          background: bg,
          willChange: "transform",
          transform: "scale(1.15)",
        }}
      />
    </div>
  );
}
