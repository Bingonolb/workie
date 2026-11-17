"use client";

import { useEffect } from "react";

let verrous = 0;
let positionAvant = 0;

/**
 * Fige la page derrière une fenêtre ouverte (offre, filtres…).
 *
 * `overflow: hidden` seul ne suffit pas sur téléphone : Safari iOS fait
 * encore défiler la page sous le doigt, et l'écran de derrière bouge pendant
 * qu'on choisit un filtre. On fixe donc le corps de page à sa position
 * actuelle, puis on la restitue à la fermeture : on revient au même endroit.
 * Un compteur gère les fenêtres ouvertes l'une sur l'autre.
 */
export function useVerrouDefilement(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const b = document.body;
    if (verrous++ === 0) {
      positionAvant = window.scrollY;
      Object.assign(b.style, { position: "fixed", top: `-${positionAvant}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
    }
    return () => {
      if (--verrous > 0) return;
      Object.assign(b.style, { position: "", top: "", left: "", right: "", width: "", overflow: "" });
      window.scrollTo(0, positionAvant);
    };
  }, [actif]);
}
