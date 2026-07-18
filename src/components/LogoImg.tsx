"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

export function LogoImg({ src, alt, style, className }: { src: string; alt: string; style?: CSSProperties; className?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ ...style, opacity: visible ? 1 : 0, transition: "opacity 0.2s" }}
      className={className}
      onLoad={() => setVisible(true)}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

export function CompanyHeroLogo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <div
      className={className}
      style={{
        background: loaded ? "#fff" : "transparent",
        transition: "background 0.15s",
        // Force own GPU compositing layer — prevents iOS scroll from repainting the bg underneath the img
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "contain", opacity: loaded ? 1 : 0, transition: "opacity 0.2s", display: "block" }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
