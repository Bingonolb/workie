"use client";

import { useEffect, useRef, useState } from "react";

/** Distance à tirer, en pixels à l'écran, pour déclencher. */
export const SEUIL_TIRAGE = 92;
/** Course maximale de la page : au-delà, le doigt tire dans le vide. */
const COURSE_MAX = 170;

/**
 * Petite vibration au passage du seuil, comme dans les applications natives.
 *
 * Android : `navigator.vibrate`. Safari ne l'expose pas ; depuis iOS 18, un
 * interrupteur `<input type="checkbox" switch>` vibre quand il bascule, et
 * basculer un interrupteur invisible donne le même retour. Usage détourné :
 * si Apple le retire, il n'y a simplement plus de vibration.
 */
let interrupteur: HTMLLabelElement | null = null;
function vibrer() {
  try {
    if (typeof navigator.vibrate === "function") { navigator.vibrate(10); return; }
    if (!interrupteur) {
      interrupteur = document.createElement("label");
      interrupteur.setAttribute("aria-hidden", "true");
      interrupteur.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
      const entree = document.createElement("input");
      entree.type = "checkbox";
      entree.setAttribute("switch", "");
      entree.tabIndex = -1;
      interrupteur.appendChild(entree);
      document.body.appendChild(interrupteur);
    }
    // Le clic donne le focus à l'interrupteur : on le lui retire aussitôt,
    // sinon la page croit qu'un champ est actif et cache la barre du bas.
    const actif = document.activeElement;
    interrupteur.click();
    const entree = interrupteur.querySelector("input");
    if (entree && document.activeElement === entree) {
      entree.blur();
      if (actif instanceof HTMLElement && actif !== document.body) actif.focus({ preventScroll: true });
    }
  } catch { /* sans vibration, le geste fonctionne pareil */ }
}

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
      // Safari place parfois la page à une fraction de pixel du haut.
      if (window.scrollY > 2 || e.touches.length !== 1) { depart = null; return; }
      depart = e.touches[0].clientY;
      departX = e.touches[0].clientX;
      horizontal = false;
      courant = 0;
    };
    const mouvement = (e: TouchEvent) => {
      if (depart === null || horizontal) return;
      const dy = e.touches[0].clientY - depart;
      const dx = e.touches[0].clientX - departX;
      // Un vrai doigt bouge de 1 ou 2 px dans tous les sens au départ : juger
      // la direction là-dessus classait au hasard le geste comme horizontal,
      // et plus rien ne répondait. On attend un mouvement net.
      // Pendant cette attente, un début de tirage vers le bas est déjà retenu :
      // laissé au navigateur, il lancerait son propre défilement, et les
      // mouvements suivants ne pourraient plus être interceptés.
      if (courant === 0 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        if (dy > 0 && e.cancelable) e.preventDefault();
        return;
      }
      if (courant === 0 && Math.abs(dx) > Math.abs(dy)) { horizontal = true; return; }
      if (dy <= 0 || window.scrollY > 2) { if (courant) { courant = 0; setDistance(0); } return; }
      // Résistance : le doigt parcourt plus que l'indicateur, comme un élastique.
      // Freinage progressif : facile au début, de plus en plus dur ensuite.
      const precedent = courant;
      courant = COURSE_MAX * (1 - Math.exp(-dy / (COURSE_MAX * 1.6)));
      if (precedent < SEUIL_TIRAGE && courant >= SEUIL_TIRAGE) vibrer();
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
