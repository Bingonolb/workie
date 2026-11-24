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

/** Langues réellement proposées aux visiteurs. Étape 0 : le français seul. */
export const OUVERTES: readonly Langue[] = ["fr"];

export const estLangue = (x: unknown): x is Langue => typeof x === "string" && (LANGUES as readonly string[]).includes(x);

/** Le nom de chaque langue, écrit dans sa propre langue (sélecteur de langue). */
export const NOM_LANGUE: Record<Langue, string> = { fr: "Français", de: "Deutsch", en: "English", it: "Italiano" };

/** Pour les dates et les nombres (« 1'448 », « 24 novembre 2026 »). */
export const LOCALE_INTL: Record<Langue, string> = { fr: "fr-CH", de: "de-CH", en: "en-CH", it: "it-CH" };
