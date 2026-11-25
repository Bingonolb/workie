import type { CleMessage, Traduire } from "./traduire";

const CONTRATS = new Set(["CDI", "CDD", "Stage", "Apprentissage", "Temporaire", "Non précisé"]);

/** Le type de contrat d'une offre dans la langue de la page ; une valeur inattendue s'affiche telle quelle. */
export function libelleContrat(t: Traduire, contrat: string | null | undefined): string | null {
  if (!contrat) return null;
  return CONTRATS.has(contrat) ? t(`contrat.${contrat}` as CleMessage) : contrat;
}
