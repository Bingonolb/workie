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

function initialsOf(name: string): string {
  const words = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, " ").trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CompanyHeroLogo({ src, alt, className, name }: { src: string | null; alt: string; className?: string; name?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Ne jamais démonter le bloc, ni en cas d'échec ni faute de logo : il occupe
  // une largeur fixe dans une rangée flex, donc le retirer décalait le titre et
  // toute la ligne d'infos. Le cas normal est désormais l'absence de logo — on
  // n'affiche plus les marques de tiers — et ce sont les initiales qui tiennent
  // la place.
  return (
    <div
      className={className}
      style={{
        background: loaded ? "#fff" : "rgba(255,255,255,0.08)",
        transition: "background 0.15s",
        transform: "translateZ(0)",
        willChange: "transform",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded && (
        <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.02em", userSelect: "none" }}>
          {name ? initialsOf(name) : ""}
        </span>
      )}
      {src && !errored && (
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
      )}
    </div>
  );
}
