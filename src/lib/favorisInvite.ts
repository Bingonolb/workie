"use client";

import { creerListeAppareil } from "@/lib/listeAppareil";

/**
 * Entreprises favorites d'un visiteur sans compte, gardées dans son
 * navigateur (comme les cœurs d'Airbnb). Elles rejoignent le compte à la
 * connexion (voir fusionnerFavorisInvite). Le stockage et ses protections
 * sont communs à toutes les listes de l'appareil : voir listeAppareil.
 *
 * La clé ne change pas : les favoris déjà gardés par les visiteurs restent.
 */
const liste = creerListeAppareil("workie_favoris_invite_v1");

export const idsFavorisInvite = liste.ids;
export const estFavoriInvite = liste.contient;
export const ajouterFavoriInvite = liste.ajouter;
export const retirerFavoriInvite = liste.retirer;
export const viderFavorisInvite = liste.vider;
export const useFavorisInvite = liste.useListe;

/** Bascule ; renvoie le nouvel état. */
export function basculerFavoriInvite(id: string): boolean {
  if (liste.contient(id)) { liste.retirer(id); return false; }
  return liste.ajouter(id);
}
