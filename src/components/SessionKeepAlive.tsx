"use client";

import { useEffect } from "react";

/** Le jeton d'accès vit une heure ; on le renouvelle dix minutes avant la fin. */
const MARGE_MS = 10 * 60 * 1000;
const INTERVALLE_MS = 50 * 60 * 1000;

/**
 * Date d'expiration du jeton d'accès, lue dans le cookie, sans réseau.
 *
 * Même lecture que le middleware : le cookie est découpé en tranches au-delà
 * d'une certaine taille, il faut les recoller avant de décoder la charge du
 * jeton. On ne vérifie pas la signature, et on n'a pas à le faire : cette
 * valeur ne sert qu'à décider s'il faut appeler le serveur.
 */
type Etat =
  /** Aucun cookie de session : personne n'est connecté, rien à renouveler. */
  | { forme: "absente" }
  /** Cookie présent mais indéchiffrable : on ne sait pas, donc on renouvelle. */
  | { forme: "indechiffrable" }
  | { forme: "connue"; expiration: number };

function etatDuJeton(): Etat {
  if (typeof document === "undefined") return { forme: "absente" };

  const tranches = document.cookie
    .split(";")
    .map(c => c.trim())
    .filter(c => /^sb-.*-auth-token(\.\d+)?=/.test(c))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(c => decodeURIComponent(c.slice(c.indexOf("=") + 1)));

  if (tranches.length === 0) return { forme: "absente" };

  try {
    let brut = tranches.join("");
    if (brut.startsWith("base64-")) brut = atob(brut.slice(7));
    const jeton = JSON.parse(brut)?.access_token;
    if (typeof jeton !== "string") return { forme: "indechiffrable" };

    const charge = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = Number(charge?.exp);
    return Number.isFinite(exp) ? { forme: "connue", expiration: exp * 1000 } : { forme: "indechiffrable" };
  } catch {
    // Format changé, cookie tronqué : ne pas savoir ne doit pas se traduire
    // par « ne rien faire », sinon un changement de format côté Supabase
    // déconnecterait tout le monde au bout d'une heure, en silence.
    return { forme: "indechiffrable" };
  }
}

/**
 * Renouvelle la session, mais seulement si elle en a besoin.
 *
 * ── Pourquoi ces deux précautions ───────────────────────────────────────────
 *
 * Cette fonction partait à chaque montage de page et à chaque retour sur
 * l'onglet, sans regarder si le jeton en avait besoin. Or `/api/auth/refresh`
 * appelle `getUser()`, qui fait tourner le jeton de rafraîchissement chez
 * Supabase et renvoie le nouveau dans un `Set-Cookie`. Si la navigation
 * suivante avorte la requête avant que cette réponse arrive, le jeton a été
 * renouvelé côté serveur mais le navigateur garde l'ancien, désormais
 * révoqué : la session est morte au renouvellement suivant, sans que
 * l'utilisateur ait rien fait d'autre que naviguer vite.
 *
 * Constaté le 2026-08-12 : sept navigations enchaînées en quelques secondes
 * ont suffi à déconnecter un onglet.
 *
 * Deux verrous, chacun suffisant à lui seul :
 *
 *  · on n'appelle le serveur que dans les dix dernières minutes de validité,
 *    ce qui ramène le nombre d'appels de « un par page » à « un par heure » ;
 *  · `keepalive` demande au navigateur de mener la requête à son terme même
 *    si la page est quittée, donc d'appliquer le cookie renouvelé.
 */
async function renouvelerSiNecessaire() {
  const etat = etatDuJeton();

  if (etat.forme === "absente") return;
  if (etat.forme === "connue" && etat.expiration - Date.now() > MARGE_MS) return;

  try {
    await fetch("/api/auth/refresh", { method: "GET", credentials: "include", keepalive: true });
  } catch {
    // Réseau indisponible : le prochain passage réessaiera.
  }
}

export function SessionKeepAlive() {
  useEffect(() => {
    renouvelerSiNecessaire();

    const id = setInterval(renouvelerSiNecessaire, INTERVALLE_MS);

    // Au retour sur l'onglet : le minuteur ne tourne pas toujours en arrière-plan,
    // le jeton a pu expirer entre-temps.
    const auRetour = () => { if (document.visibilityState === "visible") renouvelerSiNecessaire(); };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, []);

  return null;
}
