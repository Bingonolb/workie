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
 * immédiatement, et une requête part en arrière-plan pour la rafraîchir.
 *
 * ── Chaque entrée appartient à un compte ────────────────────────────────────
 *
 * C'est le point important, et il a été appris à la dure. La mémoire n'était
 * vidée qu'à la déconnexion explicite. En créant un compte sans rechargement
 * complet, l'utilisateur retrouvait donc le profil du compte précédent : un
 * nouveau compte affichait le nom de quelqu'un d'autre. Fuite de données entre
 * comptes, et pas un simple défaut d'affichage.
 *
 * Chaque entrée porte désormais l'identifiant du compte auquel elle appartient,
 * lu dans le jeton de session. Une entrée écrite par un autre compte n'est
 * jamais relue : elle est ignorée, et la page repart du serveur.
 *
 * Volontairement en mémoire seulement, jamais dans localStorage : ce sont des
 * données personnelles, elles ne doivent survivre ni à la fermeture de l'onglet
 * ni à un poste partagé.
 */

type Entree = { compte: string | null; valeur: unknown };

const memoire = new Map<string, Entree>();

/**
 * Identifiant du compte connecté, lu sur place dans le cookie de session.
 *
 * On ne vérifie pas la signature, et ce n'est pas nécessaire : cette valeur ne
 * sert qu'à savoir si la mémoire appartient bien à la personne devant l'écran.
 * Toute donnée réelle provient du serveur, qui valide le jeton, lui.
 */
function compteCourant(): string | null {
  if (typeof document === "undefined") return null;
  try {
    // Le cookie est découpé en tranches (.0, .1, …) au-delà d'une certaine
    // taille ; il faut les recoller dans l'ordre.
    const tranches = document.cookie
      .split(";")
      .map(c => c.trim())
      .filter(c => /^sb-.*-auth-token(\.\d+)?=/.test(c))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(c => decodeURIComponent(c.slice(c.indexOf("=") + 1)));
    if (tranches.length === 0) return null;

    let brut = tranches.join("");
    if (brut.startsWith("base64-")) brut = atob(brut.slice(7));
    const jeton = JSON.parse(brut)?.access_token;
    if (typeof jeton !== "string") return null;

    const charge = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof charge?.sub === "string" ? charge.sub : null;
  } catch {
    // Cookie illisible : on préfère perdre le confort du cache plutôt que
    // risquer de montrer les données d'un autre.
    return null;
  }
}

export function lireCache<T>(cle: string): T | undefined {
  const e = memoire.get(cle);
  if (!e) return undefined;
  const compte = compteCourant();

  // Première vérification : l'entrée a-t-elle été écrite par ce compte ?
  if (compte === null || e.compte !== compte) {
    memoire.delete(cle);
    return undefined;
  }

  // Seconde vérification, indépendante : la réponse elle-même déclare son
  // destinataire. Deux contrôles distincts, pour qu'une erreur dans l'un ne
  // suffise pas à laisser passer les données de quelqu'un d'autre.
  const declare = (e.valeur as { compte?: unknown } | null)?.compte;
  if (typeof declare === "string" && declare !== compte) {
    memoire.delete(cle);
    return undefined;
  }

  return e.valeur as T;
}

export function ecrireCache(cle: string, valeur: unknown): void {
  memoire.set(cle, { compte: compteCourant(), valeur });
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
  if (enVol.has(cle) || lireCache(cle) !== undefined) return;
  enVol.add(cle);
  const compte = compteCourant();
  fetch(url)
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      // Le compte a pu changer pendant la requête — déconnexion, bascule de
      // compte. Trois conditions avant de ranger : identité connue, inchangée,
      // et réponse adressée à ce compte.
      if (j && compte !== null && compteCourant() === compte
          && (typeof j.compte !== "string" || j.compte === compte)) {
        memoire.set(cle, { compte, valeur: j });
      }
    })
    .catch(() => { /* le préchargement est un confort, jamais une dépendance */ })
    .finally(() => enVol.delete(cle));
}

export const CLE_PROFIL = "profil";
export const CLE_FAVORIS = "favoris";
