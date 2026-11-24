import { lang } from "next/root-params";
import { LANGUE_PAR_DEFAUT, estLangue, type Langue } from "./config";
import { traducteur } from "./serveur";
import type { Traduire } from "./traduire";

/**
 * La langue de la page en cours, pour les composants serveur : lue dans
 * l'adresse servie (/<langue>/…), sans la passer de parent en enfant.
 *
 * Réservé aux composants serveur (Next interdit `next/root-params` dans les
 * routes d'API et les actions) : c'est pourquoi ce fichier est à part.
 */
export async function langueDeLaPage(): Promise<Langue> {
  const l = await lang();
  return estLangue(l) ? l : LANGUE_PAR_DEFAUT;
}

/** `const t = await tServeur(); t("accueil.titre")` */
export async function tServeur(): Promise<Traduire> {
  return traducteur(await langueDeLaPage());
}
