"use client";

import { useState, useTransition, useEffect } from "react";
import { deleteAccount } from "@/lib/actions/auth";
import { Trash2, X } from "lucide-react";

export function DeleteAccountButton() {
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
    if (confirm !== "SUPPRIMER") return;
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
        style={{
          width: "100%", padding: "11px 16px", borderRadius: 10,
          background: "transparent", border: "1px solid rgba(239,68,68,0.2)",
          color: "rgba(239,68,68,0.6)", fontWeight: 600, fontSize: 13, cursor: "pointer",
          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Trash2 size={14} /> Supprimer mon compte
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
            aria-label="Supprimer le compte"
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--surface)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 20, padding: "28px 28px 24px", maxWidth: 420, width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#ef4444", marginBottom: 4 }}>Supprimer le compte</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Cette action est <strong style={{ color: "var(--text)" }}>irréversible</strong>. Tous tes avis, favoris et données seront définitivement supprimés.
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Tape <strong style={{ color: "var(--text)" }}>SUPPRIMER</strong> pour confirmer :
              </p>
              <input
                type="text"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                autoComplete="off"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  background: "var(--surface2)", border: "1px solid var(--border2)",
                  color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirm !== "SUPPRIMER" || pending}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  background: confirm === "SUPPRIMER" ? "#ef4444" : "rgba(239,68,68,0.2)",
                  border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: confirm === "SUPPRIMER" ? "pointer" : "not-allowed",
                  opacity: pending ? 0.6 : 1, transition: "all 0.15s",
                }}
              >
                {pending ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
