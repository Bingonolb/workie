"use client";

import { useEffect, useRef } from "react";

export function ParallaxCover({ src, gradient }: { src?: string | null; gradient?: string }) {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrolled = window.scrollY;
      el.style.transform = `scale(1.15) translateY(${scrolled * 0.3}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        ref={imgRef}
        style={{
          position: "absolute", inset: "-15%",
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: !src ? (gradient ?? "linear-gradient(135deg, #8b5cf6, #f97316)") : undefined,
          willChange: "transform",
          transform: "scale(1.15)",
          transition: "transform 0.05s linear",
        }}
      />
    </div>
  );
}
