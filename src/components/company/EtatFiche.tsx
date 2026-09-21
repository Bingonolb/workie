"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { lireCache, compteCourant, CLE_CONTEXTE } from "@/lib/cacheSession";

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
      // Le marqueur « connecte » ne suffit pas : il survit a la deconnexion.
      // Un visiteur qui s'etait connecte un jour arrivait donc sur une fiche
      // nette, que l'appel suivant floutait une demi-seconde plus tard ; c'est
      // l'effet « net puis flou » constate en venant de l'accueil. Sans cookie
      // de session, il n'y a pas de compte, et la fiche reste floutee des la
      // premiere image.
      if (compteCourant() !== null && localStorage.getItem(CLE_MEMOIRE) === "1") {
        // Même raison : le serveur ignore ce marqueur, l'ajuster avant peinture
        // est ce qui évite le clignotement.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEtat(e => ({ ...e, isLoggedIn: true }));
      }
    } catch { /* stockage indisponible : on reste en visiteur */ }

    /*
     * La flamme est connue avant le reseau, quand elle peut l'etre.
     *
     * La barre de navigation demande le contexte du visiteur a chaque page et
     * le garde en memoire : la liste de ses favoris y est deja. On la lit ici,
     * avant peinture, plutot que d'attendre l'appel propre a la fiche, qui
     * arrive deux a trois cents millisecondes plus tard. C'est ce delai qu'on
     * voyait comme une flamme qui s'allume en retard.
     *
     * Dans un effet de disposition et non au premier rendu : le serveur rend
     * l'etat visiteur, et un premier rendu client different de lui casserait
     * l'hydratation. Rien n'est accorde par cette lecture, l'appel qui suit
     * reste seul juge.
     */
    const ctx = lireCache<{ isLoggedIn?: boolean; isAdmin?: boolean; favIds?: string[]; flameIds?: string[] }>(CLE_CONTEXTE);
    // lireCache refuse deja toute entree sans compte identifiable ; la garde
    // est redite ici parce que c'est elle qui decide du flou.
    if (ctx && compteCourant() !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEtat(e => ({
        ...e,
        isLoggedIn: ctx.isLoggedIn ?? e.isLoggedIn,
        isAdmin: ctx.isAdmin ?? e.isAdmin,
        isFav: (ctx.favIds ?? []).includes(companyId) || (ctx.flameIds ?? []).includes(companyId),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

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
