"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

/**
 * Supprime une campagne jamais payée.
 *
 * La confirmation se fait sur place plutôt que dans une fenêtre du navigateur :
 * le bouton se change en question, avec le nom de la campagne déjà lu juste
 * au-dessus. Une boîte de dialogue système arrive détachée de la ligne qu'elle
 * concerne, et sur une liste de campagnes homonymes, comme deux essais du même
 * visuel, elle ne dit pas laquelle on efface.
 */
export function DeleteCampaignButton({
  campaignId,
  onDelete,
}: {
  campaignId: string;
  onDelete: (id: string) => Promise<{ error?: string }>;
}) {
  const [confirme, setConfirme] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();

  function supprimer() {
    setErreur("");
    demarrer(async () => {
      const r = await onDelete(campaignId);
      if (r?.error) {
        setErreur(r.error);
        setConfirme(false);
      }
    });
  }

  if (!confirme) {
    return (
      <button
        type="button"
        onClick={() => setConfirme(true)}
        style={boutonDiscret}
        aria-label="Supprimer cette campagne"
      >
        <Trash2 size={11} aria-hidden="true" /> Supprimer
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Supprimer&nbsp;?</span>
      <button type="button" onClick={supprimer} disabled={enCours} style={{
        ...boutonDiscret,
        color: "#ef4444",
        borderColor: "rgba(239,68,68,0.35)",
        background: "rgba(239,68,68,0.08)",
        cursor: enCours ? "not-allowed" : "pointer",
      }}>
        {enCours ? "…" : "Oui"}
      </button>
      <button type="button" onClick={() => setConfirme(false)} disabled={enCours} style={boutonDiscret}>
        Annuler
      </button>
      {erreur && <span role="alert" style={{ fontSize: 11, color: "#ef4444" }}>{erreur}</span>}
    </span>
  );
}

const boutonDiscret: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  padding: "5px 12px",
  borderRadius: 8,
  border: "1px solid var(--border2)",
  background: "transparent",
  cursor: "pointer",
};
