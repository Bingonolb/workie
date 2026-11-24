"use client";

import { useSyncExternalStore } from "react";

/**
 * Une liste d'identifiants gardée dans le navigateur d'un visiteur sans
 * compte : ses entreprises favorites, ses offres enregistrées. Elle survit à
 * la fermeture de l'onglet, sur le même appareil, et rejoint le compte à la
 * connexion.
 *
 * Robustesse :
 *  - stockage indisponible (navigation privée, quota, cookies bloqués) : tout
 *    continue de fonctionner, en mémoire, le temps de la visite ;
 *  - contenu illisible ou d'un ancien format : ignoré, jamais une erreur ;
 *  - seuls des identifiants au format UUID sont gardés, au plus `max` ;
 *  - les onglets ouverts se mettent à jour entre eux (événement « storage »).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIDE: ReadonlySet<string> = new Set();

export type ListeAppareil = {
  ids(): string[];
  contient(id: string): boolean;
  /** Ajoute en tête ; renvoie vrai si l'identifiant est maintenant dans la liste. */
  ajouter(id: string): boolean;
  retirer(id: string): void;
  vider(): void;
  /** La liste à jour en direct. Vide côté serveur. */
  useListe(): ReadonlySet<string>;
};

export function creerListeAppareil(cle: string, max = 300): ListeAppareil {
  const evenement = `workie:${cle}`;
  let memoire: string[] | null = null;
  let instantane: ReadonlySet<string> = new Set();

  const lire = (): string[] => {
    if (memoire) return memoire;
    try {
      const brut = localStorage.getItem(cle);
      const v = brut ? JSON.parse(brut) : [];
      memoire = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, max) : [];
    } catch {
      memoire = [];
    }
    instantane = new Set(memoire);
    return memoire;
  };

  const ecrire = (ids: string[]) => {
    memoire = ids.slice(0, max);
    instantane = new Set(memoire);
    try { localStorage.setItem(cle, JSON.stringify(memoire)); } catch { /* reste en mémoire pour la visite */ }
    window.dispatchEvent(new Event(evenement));
  };

  const abonner = (rappel: () => void) => {
    const surStockage = (e: StorageEvent) => { if (e.key === cle) { memoire = null; lire(); rappel(); } };
    window.addEventListener(evenement, rappel);
    window.addEventListener("storage", surStockage);
    return () => {
      window.removeEventListener(evenement, rappel);
      window.removeEventListener("storage", surStockage);
    };
  };

  const serveur = typeof window === "undefined";
  return {
    ids: () => (serveur ? [] : [...lire()]),
    contient: id => !serveur && lire().includes(id),
    ajouter: id => {
      if (serveur || !UUID.test(id)) return false;
      ecrire([id, ...lire().filter(x => x !== id)]);
      return true;
    },
    retirer: id => { if (!serveur) ecrire(lire().filter(x => x !== id)); },
    vider: () => {
      if (serveur) return;
      memoire = [];
      instantane = new Set();
      try { localStorage.removeItem(cle); } catch { /* sans conséquence */ }
      window.dispatchEvent(new Event(evenement));
    },
    useListe: () => useSyncExternalStore(abonner, () => { lire(); return instantane; }, () => VIDE),
  };
}
