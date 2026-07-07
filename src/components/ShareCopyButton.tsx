"use client";

import { useState } from "react";

export function ShareCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={copy}
      style={{
        width: "100%", padding: "10px 0", borderRadius: 9,
        background: copied ? "#10b981" : "linear-gradient(135deg, #8b5cf6, #f97316)",
        color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      {copied ? "✓ Copié !" : "Copier le lien"}
    </button>
  );
}
