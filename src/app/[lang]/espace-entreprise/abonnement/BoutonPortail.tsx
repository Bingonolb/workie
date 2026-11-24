"use client";

import { useState, useTransition } from "react";
import { ouvrirPortailAbonnement } from "@/lib/actions/espaceEntreprise";

export function BoutonPortail() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <button type="button" className="btn btn-encre" disabled={enCours} onClick={() => {
        setErreur(null);
        demarrer(async () => {
          const r = await ouvrirPortailAbonnement();
          if (r.url) window.location.assign(r.url); else setErreur(r.error ?? "Erreur.");
        });
      }}>
        {enCours ? "Ouverture…" : "Gérer mon abonnement"}
      </button>
      {erreur && <p role="alert" style={{ fontSize: 13, color: "#ef4444" }}>{erreur}</p>}
    </div>
  );
}
