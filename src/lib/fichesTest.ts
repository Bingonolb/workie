/**
 * Fiches de test : de vraies lignes en base, pour essayer un parcours de bout
 * en bout (revendication, espace entreprise) sur l'adresse d'essai.
 *
 * La base est commune à l'essai et à la production. Ces fiches sont donc
 * rangées dans une catégorie non publiée, qui les cache partout sur workie.ch,
 * et cette liste les rend joignables hors production seulement : par leur
 * adresse et par la recherche, comme une fiche ordinaire. Elles n'apparaissent
 * dans aucune liste ni plan du site, et rien de tout cela n'existe en production.
 */
export const FICHES_TEST = new Set(["wevenz-sarl"]);

/** Vrai hors production : les fiches de test y sont joignables et trouvables. */
export const fichesTestActives = process.env.VERCEL_ENV !== "production";

/** Vrai pour une fiche de test, sur une adresse autre que la production. */
export function ficheTestVisible(slug: string | null | undefined): boolean {
  return !!slug && FICHES_TEST.has(slug) && process.env.VERCEL_ENV !== "production";
}
