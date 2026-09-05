"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

function montant(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

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
        background: loading ? "rgba(139,92,246,0.5)" : "var(--brand)",
        cursor: loading ? "not-allowed" : "pointer",
      }}>
        {/* « Payer CHF 71.00 » : les deux décimales ne portent aucune
            information quand le budget tombe juste, et sur trois cent
            soixante-quinze pixels elles suffisaient à pousser le bouton
            suivant à la ligne. */}
        <CreditCard size={12} aria-hidden="true" /> {loading ? "…" : `Payer CHF ${montant(Number(total))}`}
      </button>
      {error && <p role="alert" style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</p>}
    </div>
  );
}
