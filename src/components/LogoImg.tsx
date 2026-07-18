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
      style={{ ...style, opacity: visible ? 1 : 0, transition: "opacity 0.15s" }}
      className={className}
      onLoad={() => setVisible(true)}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}
