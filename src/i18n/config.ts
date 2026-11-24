/**
 * Langues du site.
 *
 * Le français est la langue d'origine : ses adresses restent à la racine
 * (workie.ch/explore), les autres prennent un préfixe (workie.ch/de/explore).
 * Les langues listées ici mais pas encore ouvertes (`OUVERTES`) ne sont ni
 * proposées ni servies : on les ouvre une à une, une fois traduites et relues.
 */
export const LANGUES = ["fr", "de", "en", "it"] as const;
export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = "fr";

/**
 * Langues réellement servies et proposées. Réglées par environnement
 * (NEXT_PUBLIC_LANGUES, ex. « fr,de ») : on ouvre une langue sur le site
 * d'essai pour la relire, avant de l'ouvrir en production. Le français est
 * toujours ouvert.
 */
export const OUVERTES: readonly Langue[] = [...new Set<Langue>([
  "fr",
  ...(process.env.NEXT_PUBLIC_LANGUES ?? "").split(",").map(s => s.trim()).filter(estLangueBrute),
])];
function estLangueBrute(x: string): x is Langue { return (LANGUES as readonly string[]).includes(x); }
export const estOuverte = (x: unknown): x is Langue => typeof x === "string" && (OUVERTES as readonly string[]).includes(x);

/** Cookie qui garde la langue choisie (visiteur comme compte). */
export const COOKIE_LANGUE = "workie_langue";

export const estLangue = (x: unknown): x is Langue => typeof x === "string" && (LANGUES as readonly string[]).includes(x);

/** Le nom de chaque langue, écrit dans sa propre langue (sélecteur de langue). */
export const NOM_LANGUE: Record<Langue, string> = { fr: "Français", de: "Deutsch", en: "English", it: "Italiano" };

/** Pour les dates et les nombres (« 1'448 », « 24 novembre 2026 »). */
export const LOCALE_INTL: Record<Langue, string> = { fr: "fr-CH", de: "de-CH", en: "en-CH", it: "it-CH" };
