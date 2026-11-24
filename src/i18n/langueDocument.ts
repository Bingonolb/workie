import { estLangue, LANGUE_PAR_DEFAUT, type Langue } from "./config";

/**
 * La langue de la page affichée, lue sur <html lang="de-CH">.
 *
 * Pour le code du navigateur hors composant (appels au serveur) : la langue
 * ne change jamais sans recharger la page, elle est donc sûre à relire.
 */
export function langueDocument(): Langue {
  if (typeof document === "undefined") return LANGUE_PAR_DEFAUT;
  const l = document.documentElement.lang.slice(0, 2);
  return estLangue(l) ? l : LANGUE_PAR_DEFAUT;
}
