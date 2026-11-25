"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";
import { riche } from "@/i18n/riche";

const GRAS = { b: (c: React.ReactNode) => <strong style={{ color: "var(--text)" }}>{c}</strong> };

import { useState, useTransition, useEffect } from "react";
import { deleteAccount } from "@/lib/actions/auth";
import { X } from "lucide-react";

export function DeleteAccountButton() {
  const t = useT();
  // Le mot à taper suit la langue (« SUPPRIMER », « LÖSCHEN »).
  const MOT = t("profil.motConfirmation");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, pending]);

  const handleDelete = () => {
    if (confirm !== MOT) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAccount();
      if (res?.error) setError(res.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // Du texte, pas un bouton. Supprimer son compte est irreversible et
        // se fait une fois : cela doit se trouver, jamais s'offrir.
        style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          color: "var(--text-muted)", fontWeight: 400, fontSize: 12.5,
          fontFamily: "inherit", width: "fit-content",
        }}
      >
        {t("profil.supprimerCompte")}
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("profil.supprimerLeCompte")}
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--surface)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 20, padding: "28px 28px 24px", maxWidth: 420, width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#ef4444", marginBottom: 4 }}>{t("profil.supprimerLeCompte")}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {riche(t("profil.irreversible"), GRAS)}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("profil.fermer")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                {riche(t("profil.tapez", { mot: MOT }), GRAS)}
              </p>
              <input
                type="text"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={MOT}
                aria-label={t("profil.confirmerSuppression", { mot: MOT })}
                autoComplete="off"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  background: "var(--surface2)", border: "1px solid var(--border2)",
                  color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p role="alert" style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                {t("profil.annuler")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirm !== MOT || pending}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  background: confirm === MOT ? "#ef4444" : "rgba(239,68,68,0.2)",
                  border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: confirm === MOT ? "pointer" : "not-allowed",
                  opacity: pending ? 0.6 : 1, transition: "all 0.15s",
                }}
              >
                {pending ? t("profil.suppression") : t("profil.supprimerDefinitivement")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
