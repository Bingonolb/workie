"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { oublier, CLE_FAVORIS, CLE_PROFIL, CLE_CONTEXTE } from "@/lib/cacheSession";
import { useEtatSynchronise } from "@/lib/useEtatSynchronise";

export function SaveButton({ companyId, initialFav }: { companyId: string; initialFav: boolean }) {
  const [fav, setFav] = useEtatSynchronise(initialFav);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const prev = fav;
    setFav(f => !f);
    startTransition(async () => {
      try {
        await toggleFavorite(companyId);
        // La liste des favoris et le profil viennent de changer : ce qui est
        // en memoire est faux. On l'oublie plutot que de le reecrire, la
        // prochaine page le redemandera une fois.
        oublier(CLE_FAVORIS, CLE_PROFIL, CLE_CONTEXTE);
      }
      catch { setFav(prev); }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="btn btn-photo"
      // Sauvegardé : la flamme prend la couleur, le bouton garde son verre.
      // Un fond orange de plus sur une photo ferait deux signaux pour un seul
      // etat.
      style={fav ? { color: "#f97316", borderColor: "rgba(249,115,22,0.55)" } : undefined}
    >
      <Flame size={16} fill={fav ? "#f97316" : "none"} aria-hidden="true" /> {fav ? "Sauvegardé" : "Sauvegarder"}
    </button>
  );
}
