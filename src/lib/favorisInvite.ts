"use client";

import { useSyncExternalStore } from "react";

/**
 * Favoris d'un visiteur sans compte, gardés dans son navigateur (comme les
 * cœurs d'Airbnb). Ils survivent à la fermeture de l'onglet, sur le même
 * appareil, et rejoignent le compte à la connexion (voir fusionnerFavorisInvite).
 *
 * Robustesse :
 *  - stockage indisponible (navigation privée, quota, cookies bloqués) : tout
 *    continue de fonctionner, en mémoire, le temps de la visite ;
 *  - contenu illisible ou d'un ancien format : ignoré, jamais une erreur ;
 *  - seuls des identifiants au format UUID sont gardés, au plus MAX ;
 *  - les onglets ouverts se mettent à jour entre eux (événement « storage »).
 */

const CLE = "workie_favoris_invite_v1";
const MAX = 300;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENEMENT = "workie:favoris-invite";

let memoire: string[] | null = null;
let instantane: ReadonlySet<string> = new Set();

function lire(): string[] {
  if (memoire) return memoire;
  try {
    const brut = localStorage.getItem(CLE);
    const v = brut ? JSON.parse(brut) : [];
    memoire = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, MAX) : [];
  } catch {
    memoire = [];
  }
  instantane = new Set(memoire);
  return memoire;
}

function ecrire(ids: string[]) {
  memoire = ids.slice(0, MAX);
  instantane = new Set(memoire);
  try { localStorage.setItem(CLE, JSON.stringify(memoire)); } catch { /* reste en mémoire pour la visite */ }
  window.dispatchEvent(new Event(EVENEMENT));
}

export function idsFavorisInvite(): string[] {
  return typeof window === "undefined" ? [] : [...lire()];
}

export function estFavoriInvite(id: string): boolean {
  return typeof window !== "undefined" && lire().includes(id);
}

/** Ajoute (en tête) ; renvoie vrai si l'entreprise est maintenant en favori. */
export function ajouterFavoriInvite(id: string): boolean {
  if (typeof window === "undefined" || !UUID.test(id)) return false;
  const ids = lire().filter(x => x !== id);
  ecrire([id, ...ids]);
  return true;
}

export function retirerFavoriInvite(id: string) {
  if (typeof window === "undefined") return;
  ecrire(lire().filter(x => x !== id));
}

/** Bascule ; renvoie le nouvel état. */
export function basculerFavoriInvite(id: string): boolean {
  if (estFavoriInvite(id)) { retirerFavoriInvite(id); return false; }
  return ajouterFavoriInvite(id);
}

export function viderFavorisInvite() {
  if (typeof window === "undefined") return;
  memoire = [];
  instantane = new Set();
  try { localStorage.removeItem(CLE); } catch { /* sans conséquence */ }
  window.dispatchEvent(new Event(EVENEMENT));
}

function abonner(rappel: () => void) {
  const surStockage = (e: StorageEvent) => {
    if (e.key === CLE) { memoire = null; lire(); rappel(); }
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", surStockage);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", surStockage);
  };
}

const VIDE: ReadonlySet<string> = new Set();

/** Les favoris du visiteur, à jour en direct. Vide côté serveur. */
export function useFavorisInvite(): ReadonlySet<string> {
  return useSyncExternalStore(
    abonner,
    () => { lire(); return instantane; },
    () => VIDE,
  );
}
