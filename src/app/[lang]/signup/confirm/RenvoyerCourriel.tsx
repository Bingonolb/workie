"use client";

import { useEffect, useState } from "react";
import { renvoyerConfirmation } from "@/lib/actions/auth";

/**
 * Renvoyer le lien de confirmation.
 *
 * Un délai de 60 secondes entre deux envois : c'est celui que Supabase impose
 * de toute façon, et le dire vaut mieux qu'un bouton qui échoue en silence.
 */
export function RenvoyerCourriel({ email }: { email: string }) {
  const [etat, setEtat] = useState<"pret" | "envoi" | "envoye" | "echec">("pret");
  const [attente, setAttente] = useState(0);

  useEffect(() => {
    if (attente <= 0) return;
    const t = window.setTimeout(() => setAttente(a => a - 1), 1000);
    return () => window.clearTimeout(t);
  }, [attente]);

  const renvoyer = async () => {
    setEtat("envoi");
    const { ok } = await renvoyerConfirmation(email);
    setEtat(ok ? "envoye" : "echec");
    setAttente(60);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
      <button
        type="button"
        onClick={renvoyer}
        disabled={etat === "envoi" || attente > 0}
        className="btn btn-clair btn-bloc"
      >
        {etat === "envoi" ? "Envoi…" : attente > 0 ? `Renvoyer dans ${attente} s` : "Renvoyer le courriel"}
      </button>
      {etat === "envoye" && (
        <p role="status" style={{ fontSize: 13, color: "var(--text-muted)" }}>Un nouveau lien est parti.</p>
      )}
      {etat === "echec" && (
        <p role="status" style={{ fontSize: 13, color: "var(--text-muted)" }}>L&apos;envoi n&apos;a pas abouti. Réessayez dans une minute.</p>
      )}
    </div>
  );
}
