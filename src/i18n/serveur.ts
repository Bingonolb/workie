import { LANGUE_PAR_DEFAUT, estOuverte, type Langue } from "./config";
import { creerTraducteur, type Messages, type Traduire } from "./traduire";
import fr from "./messages/fr.json";

/**
 * Les textes d'une langue, côté serveur (pages, métadonnées, e-mails).
 * Chaque dictionnaire n'est chargé que s'il est demandé. Une langue sans
 * dictionnaire encore retombe sur le français.
 */
const DICTIONNAIRES: Partial<Record<Langue, () => Promise<Messages>>> = {
  fr: async () => fr,
  // Un dictionnaire incomplet est permis : chaque clé absente retombe sur le français.
  de: async () => (await import("./messages/de.json")).default as Messages,
};

export async function messagesDe(langue: Langue): Promise<Messages> {
  return (await DICTIONNAIRES[langue]?.()) ?? fr;
}

export async function traducteur(langue: unknown = LANGUE_PAR_DEFAUT): Promise<Traduire> {
  // Une langue fermée sur ce site (cookie resté d’un essai) retombe sur le français.
  const l = estOuverte(langue) ? langue : LANGUE_PAR_DEFAUT;
  return creerTraducteur(l, await messagesDe(l), fr);
}
