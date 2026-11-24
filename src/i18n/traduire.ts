import type fr from "./messages/fr.json";
import { LOCALE_INTL, type Langue } from "./config";

/**
 * Traduction : une fonction, des clés vérifiées à la compilation.
 *
 * Le dictionnaire français fait foi : sa forme définit les clés de toutes les
 * langues. Une clé mal écrite, ou absente du français, ne compile pas. Une
 * clé absente d'une autre langue retombe sur le français, et n'est jamais
 * affichée telle quelle.
 *
 * Variables : « {nom} » est remplacé par `vars.nom`.
 * Pluriel : une valeur objet { "one": …, "other": … } est choisie selon
 * `vars.n`, avec les règles de la langue (Intl.PluralRules) ; « {n} » y est
 * écrit au format suisse de la langue (« 1'448 »).
 */

export type Messages = typeof fr;

type Feuille = string | { one?: string; other: string };
/** Toutes les clés « groupe.cle » du dictionnaire, en type. */
type Cles<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Feuille ? `${P}${K}` : Cles<T[K], `${P}${K}.`>;
}[keyof T & string];
export type CleMessage = Cles<Messages>;

export type Vars = Record<string, string | number>;
export type Traduire = (cle: CleMessage, vars?: Vars) => string;

function chercher(messages: unknown, cle: string): Feuille | undefined {
  let v: unknown = messages;
  for (const morceau of cle.split(".")) {
    if (v && typeof v === "object" && morceau in v) v = (v as Record<string, unknown>)[morceau];
    else return undefined;
  }
  return typeof v === "string" || (v && typeof v === "object" && "other" in v) ? (v as Feuille) : undefined;
}

export function creerTraducteur(langue: Langue, messages: Messages, repli?: Messages): Traduire {
  const pluriels = new Intl.PluralRules(LOCALE_INTL[langue]);
  const nombre = new Intl.NumberFormat(LOCALE_INTL[langue]);
  return (cle, vars) => {
    const feuille = chercher(messages, cle) ?? (repli ? chercher(repli, cle) : undefined);
    if (feuille === undefined) return cle; // ne devrait pas arriver : les clés sont typées
    let texte = typeof feuille === "string"
      ? feuille
      : (pluriels.select(Number(vars?.n ?? 0)) === "one" && feuille.one) || feuille.other;
    if (vars) {
      texte = texte.replace(/\{(\w+)\}/g, (m, nom: string) => {
        const v = vars[nom];
        if (v === undefined) return m;
        return typeof v === "number" ? nombre.format(v) : v;
      });
    }
    return texte;
  };
}
