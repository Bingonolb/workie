"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export function PayCampaignButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            else { setError(data.error ?? "Erreur"); setLoading(false); }
          } catch { setError("Erreur réseau"); setLoading(false); }
        }}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none",
          padding: "5px 14px", borderRadius: 8,
          background: loading ? "rgba(239,68,68,0.5)" : "#ef4444",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        <CreditCard size={12} /> {loading ? "Redirection…" : "Payer maintenant"}
      </button>
      {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
    </div>
  );
}
