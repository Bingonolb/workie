"use client";

import { useEffect, useSyncExternalStore } from "react";
import { creerListeAppareil } from "@/lib/listeAppareil";
import { compteCourant, oublier, CLE_OFFRES_ENREGISTREES } from "@/lib/cacheSession";
import { enregistrerOffre, retirerOffre, importerOffresAppareil } from "@/lib/actions/offresEnregistrees";

/**
 * Les offres enregistrées (signet), une seule source de vérité pour tout le
 * site : carte d'Explorer, aperçu, swipe, favoris.
 *
 *  - Compte connecté : la liste vient du serveur, et chaque geste y est
 *    envoyé (affiché tout de suite, annulé si le serveur refuse).
 *  - Visiteur : la liste est gardée dans son navigateur (listeAppareil), et
 *    rejoint son compte quand il en crée un.
 *
 * Cloisonnement (CLAUDE.md) : l'état mémorisé porte le compte qui l'a chargé.
 * Si le compte change dans l'onglet, il est jeté et rechargé ; la réponse du
 * serveur doit déclarer ce même compte, sinon elle est ignorée.
 */

const appareil = creerListeAppareil("workie_offres_appareil_v1");

type Etat = {
  /** « compte » : liste du serveur ; « appareil » : visiteur ; « inconnu » : pas encore chargé. */
  mode: "inconnu" | "compte" | "appareil";
  /** Compte auquel appartient `ids` (mode « compte »). */
  compte: string | null;
  ids: ReadonlySet<string>;
};

let etat: Etat = { mode: "inconnu", compte: null, ids: new Set() };
const abonnes = new Set<() => void>();
const publier = (suite: Etat) => { etat = suite; for (const f of abonnes) f(); };
let chargement: Promise<void> | null = null;

/** L'état présent des signets (lecture seule). */
export const lireSignets = (): Readonly<Etat> => etat;

/** Ramène la liste du compte, ou bascule en mode visiteur (401). */
export function chargerSignets(): Promise<void> {
  if (chargement) return chargement;
  const compte = compteCourant();
  chargement = (async () => {
    try {
      const r = await fetch("/api/user/offres-enregistrees", { cache: "no-store" });
      if (r.status === 401) { publier({ mode: "appareil", compte: null, ids: new Set() }); return; }
      if (!r.ok) return; // on retentera au prochain montage, sans rien afficher de faux
      const d = await r.json() as { compte?: string; ids?: string[] };
      // La réponse doit être adressée au compte présent, qui ne doit pas avoir
      // changé pendant la requête.
      if (!compte || d.compte !== compte || compteCourant() !== compte) return;
      publier({ mode: "compte", compte, ids: new Set(d.ids ?? []) });
      await reprendreAppareil();
    } catch { /* réseau : on retentera */ }
    finally { chargement = null; }
  })();
  return chargement;
}

/**
 * Offres gardées comme visiteur, puis connexion : elles rejoignent le compte.
 * Le navigateur n'est vidé qu'après réussite (un échec réseau retentera).
 */
let reprise = false;
async function reprendreAppareil() {
  const ids = appareil.ids();
  if (!ids.length || reprise) return;
  reprise = true;
  try {
    await importerOffresAppareil(ids);
    appareil.vider();
    oublier(CLE_OFFRES_ENREGISTREES);
    publier({ ...etat, ids: new Set([...ids, ...etat.ids]) });
  } catch { /* on retentera */ }
  finally { reprise = false; }
}

/**
 * Enregistrer ou retirer : deux intentions explicites (jamais une bascule
 * aveugle). Le geste s'affiche aussitôt, puis il est annulé si le serveur
 * ne l'a pas pris.
 */
export async function poserSignet(id: string, enregistre: boolean): Promise<void> {
  if (etat.mode === "appareil") {
    if (enregistre) appareil.ajouter(id); else appareil.retirer(id);
    return;
  }
  const avant = etat.ids;
  const suite = new Set(avant);
  if (enregistre) suite.add(id); else suite.delete(id);
  publier({ ...etat, ids: suite });
  oublier(CLE_OFFRES_ENREGISTREES);
  const ok = await (enregistre ? enregistrerOffre(id) : retirerOffre(id)).catch(() => false);
  if (!ok) publier({ ...etat, ids: avant });
}

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => { abonnes.delete(rappel); };
}
const SERVEUR: Etat = { mode: "inconnu", compte: null, ids: new Set() };

/**
 * L'état des signets, à jour en direct.
 * `estEnregistree(id)` dit si l'offre est gardée, pour un compte comme pour
 * un visiteur ; `pret` passe à vrai une fois la liste connue.
 */
export function useOffresEnregistrees() {
  const e = useSyncExternalStore(abonner, () => etat, () => SERVEUR);
  const locales = appareil.useListe();
  useEffect(() => {
    // Premier montage, ou compte changé dans l'onglet : on (re)charge.
    const compte = compteCourant();
    if (etat.mode === "inconnu" || (etat.mode === "compte" && etat.compte !== compte) || (etat.mode === "appareil" && compte)) {
      if (etat.mode !== "inconnu") publier({ mode: "inconnu", compte: null, ids: new Set() });
      void chargerSignets();
    }
  }, []);
  const ids = e.mode === "appareil" ? locales : e.ids;
  return {
    pret: e.mode !== "inconnu",
    connecte: e.mode === "compte",
    ids,
    estEnregistree: (id: string) => ids.has(id),
  };
}

/** Pour la page des favoris d'un visiteur : ses identifiants gardés. */
export const idsOffresAppareil = appareil.ids;
