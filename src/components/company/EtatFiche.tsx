"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

export function FournisseurEtatFiche({ companyId, children }: { companyId: string; children: React.ReactNode }) {
  const [etat, setEtat] = useState<EtatFiche>(VISITEUR);

  useEffect(() => {
    let annule = false;
    fetch(`/api/company/${companyId}/me`)
      .then(r => r.json())
      .then(d => { if (!annule) setEtat({ ...VISITEUR, ...d }); })
      // Sur échec on reste en état visiteur : mieux vaut une fiche consultable
      // qu'une fiche bloquée.
      .catch(() => { /* état visiteur conservé */ });
    return () => { annule = true; };
  }, [companyId]);

  return <Contexte.Provider value={etat}>{children}</Contexte.Provider>;
}
