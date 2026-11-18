"use client";

import { useEffect, useRef } from "react";

const CLE = "workie_vitrine_position";
/** Combien de cartes la vitrine montre au plus. */
const MAX = 12;

/**
 * Le rail horizontal de la vitrine.
 *
 * 1. Il retient où l'on en était : ouvrir une entreprise puis revenir
 *    replaçait le rail au début. La position est notée au clic et rendue au
 *    retour (même onglet).
 * 2. Il écarte les photos trop petites pour leur carte. Une carte en
 *    portrait remplie par une photo en paysage demande une image environ
 *    2,4 fois plus large que la carte ; quelques originaux du catalogue n'ont
 *    pas cette taille et paraissaient flous. Plutôt qu'une photo molle, la
 *    carte suivante.
 */
export function RailVitrine({ children }: { children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    const cartes = [...r.children] as HTMLElement[];

    const verifier = (carte: HTMLElement, img: HTMLImageElement) => {
      const source = new Image();
      source.onload = () => {
        const boite = carte.getBoundingClientRect();
        // Largeur à laquelle la photo est réellement peinte (remplissage en hauteur).
        const pixelsRendus = boite.height * (source.width / source.height) * (window.devicePixelRatio || 1);
        // Assez nette si elle fournit au moins 70 % de ces pixels.
        if (pixelsRendus > 0 && source.width < pixelsRendus * 0.7) {
          carte.dataset.flou = "1";
          masquer();
        }
      };
      source.src = img.currentSrc || img.src;
    };

    // N'affiche que les MAX premières cartes nettes.
    const masquer = () => {
      let montrees = 0;
      for (const c of cartes) {
        const garder = c.dataset.flou !== "1" && montrees < MAX;
        c.style.display = garder ? "" : "none";
        if (garder) montrees++;
      }
    };
    masquer();

    for (const c of cartes) {
      const img = c.querySelector("img");
      if (!img) continue;
      if (img.complete && img.naturalWidth) verifier(c, img);
      else img.addEventListener("load", () => verifier(c, img), { once: true });
    }

    try {
      const x = Number(sessionStorage.getItem(CLE));
      if (x > 0) r.scrollLeft = x;
    } catch { /* stockage indisponible : on repart du début */ }
  }, []);

  const noter = () => {
    try { if (rail.current) sessionStorage.setItem(CLE, String(Math.round(rail.current.scrollLeft))); } catch { /* sans gravité */ }
  };

  return <div ref={rail} className="ae-rail" onClickCapture={noter}>{children}</div>;
}
