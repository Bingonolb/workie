"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

/**
 * Partage l'état du visiteur entre les zones interactives d'une fiche.
 *
 * C'est ce découpage qui rend la fiche cacheable : le serveur produit une page
 * identique pour tout le monde, chaque visiteur récupère ensuite ce qui le
 * concerne. Tant que la réponse n'est pas arrivée, les composants affichent
 * l'état visiteur — exactement ce que le serveur a rendu — donc l'hydratation
 * ne provoque aucun clignotement.
 */

export type EtatFiche = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  penaltyCredits: number;
  isFav: boolean;
  boosted: boolean;
  penalized: boolean;
  votedReviewIds: string[];
};

const VISITEUR: EtatFiche = {
  isLoggedIn: false, isAdmin: false, penaltyCredits: 0,
  isFav: false, boosted: false, penalized: false, votedReviewIds: [],
};

const Contexte = createContext<EtatFiche>(VISITEUR);

export function useEtatFiche() {
  return useContext(Contexte);
}

/**
 * Dernier état de connexion connu, conservé entre les pages.
 *
 * La fiche est rendue une fois pour tout le monde, donc en état visiteur : le
 * contenu réservé s'affichait flouté, puis se dévoilait dès que la réponse
 * arrivait. Un utilisateur connecté voyait donc un flou d'une fraction de
 * seconde à chaque ouverture de fiche.
 *
 * On se souvient donc de son état. La valeur n'ouvre aucun accès — le serveur
 * reste seul juge, et l'appel qui suit corrige immédiatement si elle est
 * fausse — elle évite seulement de traiter en visiteur quelqu'un dont on sait
 * déjà qu'il ne l'est pas.
 */
const CLE_MEMOIRE = "workie_connecte";

export function FournisseurEtatFiche({ companyId, children }: { companyId: string; children: React.ReactNode }) {
  const [etat, setEtat] = useState<EtatFiche>(VISITEUR);

  // useLayoutEffect : appliqué avant que le navigateur peigne, donc le flou
  // n'apparaît jamais. Avec useEffect, il serait visible le temps d'une image.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(CLE_MEMOIRE) === "1") {
        setEtat(e => ({ ...e, isLoggedIn: true }));
      }
    } catch { /* stockage indisponible : on reste en visiteur */ }
  }, []);

  useEffect(() => {
    let annule = false;
    fetch(`/api/company/${companyId}/me`)
      .then(r => r.json())
      .then(d => {
        if (annule) return;
        setEtat({ ...VISITEUR, ...d });
        try { localStorage.setItem(CLE_MEMOIRE, d.isLoggedIn ? "1" : "0"); } catch { /* sans conséquence */ }
      })
      // Sur échec on reste sur l'état courant : mieux vaut une fiche
      // consultable qu'une fiche bloquée.
      .catch(() => { /* état conservé */ });
    return () => { annule = true; };
  }, [companyId]);

  return <Contexte.Provider value={etat}>{children}</Contexte.Provider>;
}
