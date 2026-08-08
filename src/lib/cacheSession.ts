/**
 * Mémoire des données personnelles, le temps d'une session de navigation.
 *
 * Les pages /profile et /favorites sont des coquilles statiques : elles
 * arrivent du cache instantanément, puis vont chercher leur contenu. Sans
 * mémoire, ce contenu était redemandé à *chaque* arrivée sur la page — on
 * revoyait le squelette à chaque aller-retour, alors que les données étaient
 * déjà connues une seconde plus tôt.
 *
 * On garde donc la dernière réponse ici. Au retour sur la page, elle s'affiche
 * immédiatement, et une requête part en arrière-plan pour la rafraîchir : si
 * rien n'a changé, l'utilisateur ne voit aucune transition ; si quelque chose
 * a changé, la valeur se met à jour sans écran d'attente.
 *
 * Volontairement en mémoire seulement, jamais dans localStorage : ce sont des
 * données personnelles, et elles ne doivent pas survivre à la fermeture de
 * l'onglet ni rester lisibles sur un poste partagé. Une déconnexion vide tout.
 */

const memoire = new Map<string, unknown>();

export function lireCache<T>(cle: string): T | undefined {
  return memoire.get(cle) as T | undefined;
}

export function ecrireCache(cle: string, valeur: unknown): void {
  memoire.set(cle, valeur);
}

/** Appelé à la déconnexion : plus rien ne doit subsister du compte précédent. */
export function viderCache(): void {
  memoire.clear();
}

/**
 * Va chercher la donnée et la range, sans rien afficher.
 *
 * Déclenché au survol ou au premier contact du lien : le temps que le doigt
 * se lève et que la page s'affiche, la réponse est déjà là. Une requête déjà
 * en vol n'est pas relancée.
 */
const enVol = new Set<string>();

export function precharger(cle: string, url: string): void {
  if (memoire.has(cle) || enVol.has(cle)) return;
  enVol.add(cle);
  fetch(url)
    .then(r => (r.ok ? r.json() : null))
    .then(j => { if (j) memoire.set(cle, j); })
    .catch(() => { /* le préchargement est un confort, jamais une dépendance */ })
    .finally(() => enVol.delete(cle));
}

export const CLE_PROFIL = "profil";
export const CLE_FAVORIS = "favoris";
