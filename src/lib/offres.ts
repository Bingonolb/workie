/** Listes de choix des offres d'emploi (hors fichier d'actions serveur, qui ne peut exporter que des fonctions). */
export const CONTRATS = ["CDI", "CDD", "Stage", "Apprentissage", "Temporaire", "Freelance"] as const;
export const MODES = ["Sur site", "Hybride", "Télétravail"] as const;
export const NIVEAUX = ["Débutant", "Confirmé", "Expérimenté", "Cadre"] as const;
export const TAUX = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

/** « 100 % » ou « 80 à 100 % », comme on l'écrit sur les offres suisses. */
export function libelleTaux(min: number | null | undefined, max: number | null | undefined): string | null {
  if (!min || !max) return null;
  return min === max ? `${max} %` : `${min} à ${max} %`;
}

const NOMS_LANGUES: Record<string, string> = { FR: "Français", DE: "Allemand", EN: "Anglais", IT: "Italien" };
export const nomLangue = (code: string) => NOMS_LANGUES[code] ?? code;

/**
 * Langue d'une offre (fr, de, en, it), devinée sur son titre et son texte.
 * Une seule règle, partagée avec la synchronisation qui l'enregistre en base
 * (colonne `langue`) pour le filtre d'Explorer.
 */
export { langueOffre } from "./synchroOffres/regles.mjs";
export const ORDRE_LANGUES = ["fr", "de", "en", "it"] as const;
