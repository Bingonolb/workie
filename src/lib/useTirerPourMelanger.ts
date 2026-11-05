"use client";

import { useEffect, useRef, useState } from "react";

/** Distance à tirer, en pixels à l'écran, pour déclencher. */
export const SEUIL_TIRAGE = 72;
/** Course maximale de l'indicateur : au-delà, le doigt tire dans le vide. */
const COURSE_MAX = 110;

/**
 * Geste « tirer vers le bas » en haut de la page, sur écran tactile.
 *
 * Le mélange automatique de l'explorateur reste celui qu'on connaît : stable
 * pendant qu'on navigue, renouvelé après une pause. Ce geste est la seule façon
 * de demander un nouvel ordre volontairement. Il ne peut pas partir par
 * accident : il faut être tout en haut, tirer franchement vers le bas, et
 * relâcher au-delà du seuil.
 *
 * Le rafraîchissement natif du navigateur est neutralisé pendant ce temps
 * (`overscroll-behavior-y: contain`) : sans cela, Chrome sur Android
 * rechargerait toute la page en même temps que notre mélange.
 *
 * Renvoie la distance tirée (0 au repos), pour dessiner l'indicateur.
 */
export function useTirerPourMelanger(actif: boolean, surDeclenchement: () => void): number {
  const [distance, setDistance] = useState(0);
  const rappel = useRef(surDeclenchement);
  useEffect(() => { rappel.current = surDeclenchement; });

  useEffect(() => {
    if (!actif) return;
    const racine = document.documentElement;
    const avant = racine.style.overscrollBehaviorY;
    racine.style.overscrollBehaviorY = "contain";

    let depart: number | null = null;
    let departX = 0;
    let courant = 0;
    let horizontal = false;

    const debut = (e: TouchEvent) => {
      if (window.scrollY > 0 || e.touches.length !== 1) { depart = null; return; }
      depart = e.touches[0].clientY;
      departX = e.touches[0].clientX;
      horizontal = false;
      courant = 0;
    };
    const mouvement = (e: TouchEvent) => {
      if (depart === null || horizontal) return;
      const dy = e.touches[0].clientY - depart;
      const dx = e.touches[0].clientX - departX;
      if (courant === 0 && Math.abs(dx) > Math.abs(dy)) { horizontal = true; return; }
      if (dy <= 0 || window.scrollY > 0) { if (courant) { courant = 0; setDistance(0); } return; }
      // Résistance : le doigt parcourt plus que l'indicateur, comme un élastique.
      courant = Math.min(COURSE_MAX, dy * 0.5);
      setDistance(courant);
      if (e.cancelable) e.preventDefault();
    };
    const fin = () => {
      if (depart === null) return;
      if (courant >= SEUIL_TIRAGE) rappel.current();
      depart = null;
      courant = 0;
      setDistance(0);
    };

    window.addEventListener("touchstart", debut, { passive: true });
    window.addEventListener("touchmove", mouvement, { passive: false });
    window.addEventListener("touchend", fin, { passive: true });
    window.addEventListener("touchcancel", fin, { passive: true });
    return () => {
      racine.style.overscrollBehaviorY = avant;
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", mouvement);
      window.removeEventListener("touchend", fin);
      window.removeEventListener("touchcancel", fin);
    };
  }, [actif]);

  return distance;
}
