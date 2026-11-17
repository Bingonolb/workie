"use client";

import { useState, useTransition } from "react";
import { Building2 } from "lucide-react";
import { entrerVueEntreprise } from "@/lib/actions/espaceEntreprise";

/**
 * Admin uniquement : ouvrir l'espace entreprise de cette fiche, tel que
 * l'entreprise le verrait.
 *
 * Il ne reste jamais muet : si la session n'a pas encore validé le code à 6
 * chiffres, il y envoie, puis ramène ici ; toute autre erreur s'affiche.
 */
export function BoutonVueEntreprise({ companyId }: { companyId: string }) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button type="button" className="btn btn-photo" disabled={enCours} aria-label="Voir l'espace entreprise de cette fiche"
        onClick={() => demarrer(async () => {
          setErreur(null);
          const r = await entrerVueEntreprise(companyId);
          if (!r.error) { window.location.assign("/espace-entreprise"); return; }
          if (r.code === "aal") {
            window.location.assign(`/securite/code?next=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          setErreur(r.error);
        })}>
        <Building2 size={15} aria-hidden="true" /> {enCours ? "…" : "Vue entreprise"}
      </button>
      {erreur && (
        <span role="alert" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, whiteSpace: "nowrap", fontSize: 12.5, fontWeight: 600, color: "#fff", background: "rgba(239,68,68,0.92)", padding: "5px 10px", borderRadius: 8 }}>
          {erreur}
        </span>
      )}
    </span>
  );
}
