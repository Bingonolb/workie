"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Précharge une fiche quand elle approche de l'écran.
 *
 * Jusqu'ici le préchargement partait au survol ou au premier contact du doigt.
 * C'est déjà mieux que rien : mesuré sur un build de production, une fiche
 * préchargée s'ouvre en 19 à 27 ms contre 345 à 996 ms sans. Mais sur un
 * téléphone, le doigt se pose et se lève en cent millisecondes : l'avance est
 * trop courte pour que la fiche soit prête.
 *
 * On part donc plus tôt, quand la carte entre dans l'écran ou s'en approche.
 * C'est ce qui fait qu'une application donne l'impression de n'attendre
 * jamais : au moment du clic, la page est déjà là.
 *
 * Trois garde-fous, parce que précharger n'est gratuit pour personne :
 *
 *   une seule fois par adresse, quel que soit le nombre de cartes qui la
 *   pointent ;
 *
 *   trois requêtes en vol au maximum, les autres attendent leur tour : sans
 *   file, une grille de vingt-quatre cartes lancerait vingt-quatre chargements
 *   d'un coup et retarderait la page qu'on est en train de lire ;
 *
 *   rien du tout en connexion lente ou en économiseur de données, où précharger
 *   ce qu'on n'ouvrira peut-être pas coûte plus que cela ne rapporte.
 */

const dejaDemandees = new Set<string>();
const file: (() => void)[] = [];
let enVol = 0;
const MAX_EN_VOL = 3;

function suivant(): void {
  if (enVol >= MAX_EN_VOL) return;
  const tache = file.shift();
  if (!tache) return;
  enVol += 1;
  tache();
}

function terminee(): void {
  enVol = Math.max(0, enVol - 1);
  suivant();
}

/** Vrai quand précharger coûterait plus que cela ne rapporte. */
function connexionMenagee(): boolean {
  const c = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === "slow-2g" || c.effectiveType === "2g" || c.effectiveType === "3g";
}

/**
 * Renvoie une ref à poser sur le lien. Dès qu'il approche de l'écran, sa
 * destination est préchargée, une fois.
 */
export function useFicheProche(href: string) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (dejaDemandees.has(href)) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (connexionMenagee()) return;

    const observateur = new IntersectionObserver(
      entrees => {
        if (!entrees.some(e => e.isIntersecting)) return;
        observateur.disconnect();
        if (dejaDemandees.has(href)) return;
        dejaDemandees.add(href);
        file.push(() => {
          // `prefetch` ne rejette pas et ne dit pas quand il a fini : on rend
          // la place après un court délai, le temps que la requête parte et
          // laisse le réseau à la suivante.
          try { router.prefetch(href); } catch { /* sans conséquence */ }
          setTimeout(terminee, 250);
        });
        suivant();
      },
      // Deux cents pixels d'avance : la carte n'est pas encore visible que sa
      // fiche est déjà demandée.
      { rootMargin: "200px" },
    );

    observateur.observe(el);
    return () => observateur.disconnect();
  }, [href, router]);

  return ref;
}
