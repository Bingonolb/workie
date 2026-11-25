"use client";

import { useT, useLangue } from "@/i18n/FournisseurLangue";

import { Flame } from "lucide-react";
import { useFavorisInvite, basculerFavoriInvite } from "@/lib/favorisInvite";

/**
 * « Sauvegarder » pour un visiteur sans compte : le favori est gardé dans le
 * navigateur et rejoindra le compte à l'inscription. Même aspect que le
 * bouton des comptes (SaveButton), pour qu'on ne voie pas la différence.
 */
export function GuestSaveButton({ companyId }: { companyId: string }) {
  const t = useT();
  const fav = useFavorisInvite().has(companyId);
  return (
    <button
      type="button"
      onClick={() => basculerFavoriInvite(companyId)}
      aria-pressed={fav}
      aria-label={fav ? t("fiche.retirerFavoris") : t("fiche.ajouterFavoris")}
      className="btn btn-photo"
      style={fav ? { color: "#f97316", borderColor: "rgba(249,115,22,0.55)" } : undefined}
    >
      <Flame size={16} fill={fav ? "#f97316" : "none"} aria-hidden="true" /> {fav ? t("fiche.sauvegarde") : t("fiche.sauvegarder")}
    </button>
  );
}
