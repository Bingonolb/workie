"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

import { useEffect, useState } from "react";
import { renvoyerConfirmation } from "@/lib/actions/auth";

/**
 * Renvoyer le lien de confirmation.
 *
 * Un délai de 60 secondes entre deux envois : c'est celui que Supabase impose
 * de toute façon, et le dire vaut mieux qu'un bouton qui échoue en silence.
 */
export function RenvoyerCourriel({ email }: { email: string }) {
  const t = useT();
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
        {etat === "envoi" ? t("mdp.envoiCourt") : attente > 0 ? t("mdp.renvoyerDans", { n: attente }) : t("mdp.renvoyer")}
      </button>
      {etat === "envoye" && (
        <p role="status" style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("mdp.nouveauLien")}</p>
      )}
      {etat === "echec" && (
        <p role="status" style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("mdp.echecEnvoi")}</p>
      )}
    </div>
  );
}
