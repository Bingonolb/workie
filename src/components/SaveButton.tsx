"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { useEtatSynchronise } from "@/lib/useEtatSynchronise";

export function SaveButton({ companyId, initialFav }: { companyId: string; initialFav: boolean }) {
  const [fav, setFav] = useEtatSynchronise(initialFav);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const prev = fav;
    setFav(f => !f);
    startTransition(async () => {
      try { await toggleFavorite(companyId); }
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
