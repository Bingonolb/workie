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
 * Langue d'une offre, devinée sur son titre et son texte : les mots courants
 * de chaque langue se comptent. Sert à regrouper les offres d'une fiche :
 * français d'abord, puis allemand, anglais, italien.
 */
const MOTS: Record<"fr" | "de" | "en" | "it", RegExp> = {
  fr: /\b(le|la|les|des|du|vous|votre|vos|nous|et|pour|avec|dans|une?|à|au|aux|est|sont|poste|avocat|collaborat|stagiaire)\b/gi,
  de: /:in\b|\/-?in\b|\b(der|die|das|und|mit|für|sie|ihre?|wir|unser|im|in der|bei|zur|zum|ein|eine|als|rechtsanw\w*|mitarbeiter\w*|praktik\w*)\b/gi,
  en: /\b(the|and|with|for|you|your|our|we|of|to|is|are|lawyer|developer|engineer|intern)\b/gi,
  it: /\b(il|lo|gli|della|delle|con|per|una?|che|sono|siamo|nostro|vostro|collaborator\w*)\b/gi,
};
export const ORDRE_LANGUES = ["fr", "de", "en", "it"] as const;
export function langueOffre(titre: string, texte?: string | null): (typeof ORDRE_LANGUES)[number] {
  const t = `${titre} ${texte ?? ""}`;
  let meilleure: (typeof ORDRE_LANGUES)[number] = "fr", score = -1;
  for (const l of ORDRE_LANGUES) {
    const n = t.match(MOTS[l])?.length ?? 0;
    if (n > score) { score = n; meilleure = l; }
  }
  return meilleure;
}
