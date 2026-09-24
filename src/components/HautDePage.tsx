"use client";

import { useEffect } from "react";

/**
 * Ouvrir une page par son début.
 *
 * Constaté le 2026-09-24 sur ordinateur : en cliquant sur une entreprise
 * depuis la grille, on arrivait sur sa fiche à 56 pixels du haut, et parfois
 * bien plus bas, au milieu des suggestions. Le routeur pose le défilement au
 * début du segment qui change, pas au début du document, et une fiche dont la
 * bannière arrive après le premier rendu décale ce repère.
 *
 * Le retour arrière garde sa position : le navigateur la rétablit lui-même, et
 * on ne la lui reprend que sur une vraie navigation, jamais sur un retour ni
 * sur une ancre.
 */
export function HautDePage() {
  useEffect(() => {
    if (window.location.hash) return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "back_forward") return;
    window.scrollTo(0, 0);
  }, []);

  return null;
}
