"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

import { Bookmark } from "lucide-react";
import { poserSignet, useOffresEnregistrees } from "@/lib/offresEnregistrees";

/**
 * Le signet d'une offre : la garde dans les favoris (onglet Offres). Privé, il
 * ne compte dans aucun classement ; la flamme reste réservée aux entreprises.
 * Le même bouton sur la carte, dans l'aperçu de l'offre et dans le swipe.
 */
export function BoutonSignet({ offreId, titre, className = "carte-offre-signet" }: { offreId: string; titre: string; className?: string }) {
  const t = useT();
  const { estEnregistree, pret } = useOffresEnregistrees();
  const garde = estEnregistree(offreId);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={garde}
      aria-label={garde ? t("fiche.signetRetirer", { titre }) : t("fiche.signetGarder", { titre })}
      title={garde ? t("fiche.signetRetirerCourt") : t("fiche.signetGarderCourt")}
      disabled={!pret}
      onClick={() => void poserSignet(offreId, !garde)}
    >
      <Bookmark size={20} strokeWidth={2} fill={garde ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
