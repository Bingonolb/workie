"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export function PayUserCampaignButton({ campaignId, total }: { campaignId: string; total: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/user/ads/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; }
      else { setError(d.error ?? "Erreur Stripe"); setLoading(false); }
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handlePay} disabled={loading} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 700, color: "#fff",
        padding: "6px 14px", borderRadius: 8, border: "none",
        background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6, #f97316)",
        cursor: loading ? "not-allowed" : "pointer",
      }}>
        <CreditCard size={12} /> {loading ? "…" : `Payer CHF ${Number(total).toFixed(2)}`}
      </button>
      {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</p>}
    </div>
  );
}
