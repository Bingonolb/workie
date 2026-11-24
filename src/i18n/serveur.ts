import { LANGUE_PAR_DEFAUT, estLangue, type Langue } from "./config";
import { creerTraducteur, type Messages, type Traduire } from "./traduire";
import fr from "./messages/fr.json";

/**
 * Les textes d'une langue, côté serveur (pages, métadonnées, e-mails).
 * Chaque dictionnaire n'est chargé que s'il est demandé. Une langue sans
 * dictionnaire encore retombe sur le français.
 */
const DICTIONNAIRES: Partial<Record<Langue, () => Promise<Messages>>> = {
  fr: async () => fr,
};

export async function messagesDe(langue: Langue): Promise<Messages> {
  return (await DICTIONNAIRES[langue]?.()) ?? fr;
}

export async function traducteur(langue: unknown = LANGUE_PAR_DEFAUT): Promise<Traduire> {
  const l = estLangue(langue) ? langue : LANGUE_PAR_DEFAUT;
  return creerTraducteur(l, await messagesDe(l), fr);
}
