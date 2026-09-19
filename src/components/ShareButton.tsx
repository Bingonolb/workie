"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ name, url, companyId }: { name: string; url: string; companyId?: string }) {
  const [copied, setCopied] = useState(false);

  /**
   * Déclare le partage, une fois qu'il a abouti.
   *
   * `navigator.share` ne tient sa promesse que si l'envoi a eu lieu : une
   * annulation la rejette. C'est ce qui permet de compter un partage réel
   * plutôt qu'un clic sur un bouton, et le classement en dépend.
   *
   * Une déclaration par entreprise et par onglet : sans cela, recopier le lien
   * trois fois de suite vaudrait cent cinquante points.
   */
  const declarer = async (canal: "systeme" | "lien") => {
    if (!companyId) return;
    const cle = `w_share_${companyId}`;
    try { if (sessionStorage.getItem(cle)) return; } catch { /* stockage refusé */ }
    try {
      await fetch(`/api/company/${companyId}/share?canal=${canal}`, { method: "POST", keepalive: true });
      sessionStorage.setItem(cle, "1");
    } catch { /* le partage a eu lieu, le compter est secondaire */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} sur Workie`, url });
        void declarer("systeme");
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      void declarer("lien");
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard denied */ }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Partager"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", transition: "all 0.2s",
      }}
    >
      {copied ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
      {copied ? "Copié !" : "Partager"}
    </button>
  );
}
