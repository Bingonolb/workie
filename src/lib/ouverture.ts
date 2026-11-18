/**
 * La revendication est-elle ouverte au public ? Activée par la variable
 * NEXT_PUBLIC_REVENDICATION_OUVERTE = 1 (espaces et retours à la ligne ignorés :
 * une valeur saisie en ligne de commande en garde souvent un).
 */
export const revendicationOuverte = (process.env.NEXT_PUBLIC_REVENDICATION_OUVERTE ?? "").trim() === "1";

/**
 * « Créer son entreprise » : NEXT_PUBLIC_CREATION_OUVERTE = 1. Activée sur
 * l'adresse d'essai seulement tant que Luc ne l'a pas validée.
 */
/** Accueil compact, à l'essai : NEXT_PUBLIC_ACCUEIL_COMPACT = 1 (adresse d'essai seulement). */
export const accueilCompact = (process.env.NEXT_PUBLIC_ACCUEIL_COMPACT ?? "").trim() === "1";

export const creationOuverte = revendicationOuverte && (process.env.NEXT_PUBLIC_CREATION_OUVERTE ?? "").trim() === "1";
