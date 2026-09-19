/**
 * Les langues dans lesquelles on travaille, probablement, dans une entreprise.
 *
 * Personne ne les a saisies : elles se déduisent de deux choses que la fiche
 * porte déjà, le canton et l'adresse du site.
 *
 * Le canton donne la ou les langues officielles du lieu. C'est la donnée la
 * plus sûre du lot : en Suisse, la langue de travail suit le territoire, et les
 * cantons bilingues le sont vraiment (Berne, Fribourg, Valais).
 *
 * L'anglais ne se déduit pas du territoire. Il s'ajoute quand l'entreprise ne
 * s'adresse manifestement pas qu'à la Suisse : un domaine qui n'est pas en
 * « .ch », ou une enseigne présente dans tout le pays.
 *
 * C'est une estimation, et elle est présentée comme telle. Le jour où une
 * entreprise réclame sa fiche, c'est à elle de corriger.
 */

/** Langues officielles par canton, dans l'ordre où on les y parle. */
const LANGUES_CANTON: Record<string, string[]> = {
  GE: ["FR"], VD: ["FR"], NE: ["FR"], JU: ["FR"],
  BE: ["DE", "FR"], FR: ["FR", "DE"], VS: ["FR", "DE"],
  TI: ["IT"], GR: ["DE", "IT", "RM"],
  ZH: ["DE"], LU: ["DE"], UR: ["DE"], SZ: ["DE"], OW: ["DE"], NW: ["DE"],
  GL: ["DE"], ZG: ["DE"], SO: ["DE"], BS: ["DE"], BL: ["DE"], SH: ["DE"],
  AR: ["DE"], AI: ["DE"], SG: ["DE"], AG: ["DE"], TG: ["DE"],
  // Enseigne présente dans toute la Suisse : les trois langues nationales.
  CH: ["FR", "DE", "IT"],
  // Liechtenstein.
  FL: ["DE"],
};

/** Vrai quand le site ne s'adresse pas qu'à la Suisse. */
function regardeAuDela(websiteUrl: string | null): boolean {
  if (!websiteUrl) return false;
  try {
    const hote = new URL(websiteUrl).hostname.toLowerCase();
    return !hote.endsWith(".ch");
  } catch {
    return false;
  }
}

/**
 * Les langues de travail probables, deux à quatre codes courts.
 * Retourne une liste vide quand le canton est inconnu : mieux vaut ne rien
 * afficher qu'affirmer sans base.
 */
export function languesDeTravail(
  canton: string | null,
  websiteUrl: string | null,
  employeeRange: string | null,
): string[] {
  if (!canton) return [];
  const base = LANGUES_CANTON[canton.toUpperCase()];
  if (!base) return [];

  const grande = employeeRange === "1001-5000" || employeeRange === "5001-10000" || employeeRange === "10001+";
  const langues = [...base];
  if (regardeAuDela(websiteUrl) || grande || canton.toUpperCase() === "CH") {
    if (!langues.includes("EN")) langues.push("EN");
  }
  // Le romanche est officiel aux Grisons mais ne se parle pas au bureau :
  // l'afficher donnerait une précision que la déduction n'a pas.
  return langues.filter(l => l !== "RM").slice(0, 4);
}
