"use client";

import { useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

export function LogoImg({ src, alt, style, className }: { src: string; alt: string; style?: CSSProperties; className?: string }) {
  const [visible, setVisible] = useState(false);
  const size = (style?.width as number) ?? 40;
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ ...style, opacity: visible ? 1 : 0, transition: "opacity 0.2s" }}
      className={className}
      onLoad={() => setVisible(true)}
      onError={() => setVisible(false)}
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
        transform: "translateZ(0)",
        willChange: "transform",
        position: "relative",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="96px"
        style={{ objectFit: "contain", opacity: loaded ? 1 : 0, transition: "opacity 0.2s" }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        priority
      />
    </div>
  );
}
