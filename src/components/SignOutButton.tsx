"use client";

import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { LogOut, X } from "lucide-react";
import { viderCache } from "@/lib/cacheSession";

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    // Les données du compte sont gardées en mémoire le temps de la navigation
    // pour éviter de les recharger à chaque retour sur le profil. Elles doivent
    // disparaître ici, sans quoi le compte suivant verrait celles du précédent.
    viderCache();
    await signOut();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "11px 16px", borderRadius: 10,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer",
          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <LogOut size={14} aria-hidden="true" /> Se déconnecter
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 10100,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer la déconnexion"
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 20, padding: "28px", maxWidth: 380, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LogOut size={20} color="#ef4444" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Fermer"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>
              Se déconnecter ?
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Vous devrez vous reconnecter pour accéder à votre profil et à vos favoris.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={pending}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "#ef4444", border: "none",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: pending ? "not-allowed" : "pointer",
                  opacity: pending ? 0.7 : 1,
                }}
              >
                {pending ? "Déconnexion…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
