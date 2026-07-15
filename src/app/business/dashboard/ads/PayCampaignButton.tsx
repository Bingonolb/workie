"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export function PayCampaignButton({ campaignId, totalBudget }: { campaignId: string; totalBudget: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch("/api/business/ads/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ campaign_id: campaignId }),
            });
            const data = await res.json();
            if (data.url) { window.location.href = data.url; }
            else { setError(data.error ?? "Erreur inattendue. Réessaie."); setLoading(false); }
          } catch { setError("Erreur réseau. Réessaie."); setLoading(false); }
        }}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 13, fontWeight: 700, color: "#fff",
          padding: "8px 18px", borderRadius: 10,
          background: loading
            ? "rgba(139,92,246,0.4)"
            : "linear-gradient(135deg, #8b5cf6, #f97316)",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 2px 12px rgba(139,92,246,0.3)",
          whiteSpace: "nowrap",
        }}
      >
        <Lock size={13} />
        {loading
          ? "Redirection vers Stripe…"
          : `Payer CHF ${totalBudget.toFixed(2)} · Lancer`}
      </button>
      {error && (
        <span style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.07)", padding: "4px 8px", borderRadius: 6 }}>
          {error}
        </span>
      )}
    </div>
  );
}
