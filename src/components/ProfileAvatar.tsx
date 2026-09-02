"use client";

import { useState } from "react";

export function ProfileAvatar({ src, initial }: { src: string | null; initial: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 20, flexShrink: 0,
      background: "var(--brand)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {src && !failed
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" loading="eager" decoding="async" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>{initial}</span>
      }
    </div>
  );
}
