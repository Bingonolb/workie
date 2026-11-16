"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { entrerVueEntreprise } from "@/lib/actions/espaceEntreprise";

/** Admin uniquement : ouvrir l'espace entreprise de cette fiche, tel que l'entreprise le verrait. */
export function BoutonVueEntreprise({ companyId }: { companyId: string }) {
  const [enCours, demarrer] = useTransition();
  return (
    <button type="button" className="btn btn-photo" disabled={enCours} aria-label="Voir l'espace entreprise de cette fiche"
      onClick={() => demarrer(async () => {
        const r = await entrerVueEntreprise(companyId);
        if (!r.error) window.location.assign("/espace-entreprise");
      })}>
      <Building2 size={15} aria-hidden="true" /> {enCours ? "…" : "Vue entreprise"}
    </button>
  );
}
