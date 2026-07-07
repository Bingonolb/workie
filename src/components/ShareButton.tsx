"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ name, url }: { name: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} sur Workie`, url });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      title="Partager"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
        backdropFilter: "blur(8px)", transition: "all 0.2s",
      }}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Copié !" : "Partager"}
    </button>
  );
}
