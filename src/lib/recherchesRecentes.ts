"use client";

import { compteCourant } from "@/lib/cacheSession";

/**
 * Les entreprises ouvertes depuis la recherche, gardées entre les visites.
 *
 * C'est ce qu'on vient chercher en rouvrant la loupe : on revient rarement sur
 * une recherche neuve, on revient sur celle d'hier. Une recherche vide n'avait
 * jusqu'ici rien à montrer qu'une phrase d'accueil.
 *
 * **La clé porte l'identifiant du compte.** C'est la règle du site : toute
 * donnée personnelle gardée côté client est liée à un compte, sinon elle
 * survit au changement de compte dans le même navigateur et s'affiche à
 * quelqu'un d'autre. Sans compte identifiable, on ne lit rien et on n'écrit
 * rien : un visiteur déconnecté n'a pas d'historique.
 *
 * `localStorage` et non la mémoire de session : l'intérêt est précisément que
 * la liste survive à la fermeture de l'onglet. Chaque lecture et chaque
 * écriture est protégée, le stockage pouvant être refusé (navigation privée,
 * site data bloqué), auquel cas la recherche fonctionne sans historique.
 */

export type EntrepriseRecente = { id: string; name: string; city: string; sector: string };

const MAX = 8;

function cle(): string | null {
  const compte = compteCourant();
  return compte ? `workie_recents_${compte}` : null;
}

export function lireRecentes(): EntrepriseRecente[] {
  const k = cle();
  if (!k) return [];
  try {
    const brut = localStorage.getItem(k);
    if (!brut) return [];
    const liste = JSON.parse(brut);
    if (!Array.isArray(liste)) return [];
    return liste.filter(
      (e): e is EntrepriseRecente =>
        !!e && typeof e.id === "string" && typeof e.name === "string",
    ).slice(0, MAX);
  } catch {
    return [];
  }
}

function ecrire(liste: EntrepriseRecente[]): EntrepriseRecente[] {
  const k = cle();
  if (!k) return liste;
  try { localStorage.setItem(k, JSON.stringify(liste.slice(0, MAX))); } catch { /* stockage refusé */ }
  return liste.slice(0, MAX);
}

/** Pose une entreprise en tête, sans doublon. */
export function ajouterRecente(e: EntrepriseRecente): EntrepriseRecente[] {
  return ecrire([e, ...lireRecentes().filter(x => x.id !== e.id)]);
}

export function retirerRecente(id: string): EntrepriseRecente[] {
  return ecrire(lireRecentes().filter(x => x.id !== id));
}

export function viderRecentes(): EntrepriseRecente[] {
  const k = cle();
  if (k) { try { localStorage.removeItem(k); } catch { /* sans conséquence */ } }
  return [];
}
