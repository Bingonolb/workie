/**
 * Fiches de test : de vraies lignes en base, pour essayer un parcours de bout
 * en bout (revendication, espace entreprise) sur l'adresse d'essai.
 *
 * La base est commune à l'essai et à la production. Ces fiches sont donc
 * rangées dans une catégorie non publiée, qui les cache partout sur workie.ch,
 * et cette liste les rend joignables par leur adresse directe hors production
 * seulement. Elles n'apparaissent dans aucune liste, recherche ni plan du site.
 */
const FICHES_TEST = new Set(["wevenz-sarl"]);

/** Vrai pour une fiche de test, sur une adresse autre que la production. */
export function ficheTestVisible(slug: string | null | undefined): boolean {
  return !!slug && FICHES_TEST.has(slug) && process.env.VERCEL_ENV !== "production";
}
