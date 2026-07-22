"use client";

import { useState, useTransition, useEffect } from "react";
import { PauseCircle, X } from "lucide-react";

interface Props {
  campaignId: string;
  onCancel: (id: string) => Promise<{ error?: string }>;
  redirectAfter?: string;
}

export function CancelCampaignButton({ campaignId, onCancel, redirectAfter }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !isPending) setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isPending]);

  function confirm() {
    setError("");
    startTransition(async () => {
      const res = await onCancel(campaignId);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        if (redirectAfter) window.location.href = redirectAfter;
        else window.location.reload();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)",
          color: "#ef4444", cursor: "pointer",
        }}
      >
        <PauseCircle size={14} /> Mettre en pause
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10200,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Confirmer l'annulation de la campagne" style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "28px 28px 24px", maxWidth: 400, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PauseCircle size={20} color="#ef4444" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Mettre en pause ?</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Cette action est réversible</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 22 }}>
              Votre campagne sera mise en pause et n&apos;apparaîtra plus sur Workie. Le budget non consommé est conservé.
              Vous pouvez contacter notre équipe pour la réactiver.
            </p>

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.07)", borderRadius: 10 }}>
                ⚠ {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  border: "1px solid var(--border2)", background: "var(--surface2)",
                  color: "var(--text)", cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={isPending}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  border: "none", background: isPending ? "var(--surface2)" : "rgba(239,68,68,0.12)",
                  color: isPending ? "var(--text-muted)" : "#ef4444",
                  cursor: isPending ? "not-allowed" : "pointer",
                  borderWidth: 1, borderStyle: "solid", borderColor: "rgba(239,68,68,0.25)",
                }}
              >
                {isPending ? "En cours…" : "Confirmer la pause"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
