/**
 * Abonnement entreprise : revendiquer et gérer sa fiche, statistiques.
 *
 * Prix de lancement décidé le 2026-11-16, après comparaison avec le marché
 * suisse (profil Basic kununu ≈ 166 CHF/mois, profil premium jobs.ch dès
 * 900 CHF/an, une annonce jobup 650 CHF). Les entreprises abonnées gardent ce
 * prix quand un niveau supérieur sera ajouté.
 */
export const ABONNEMENT = {
  mensuel: { chf: 129, libelle: "129 CHF par mois", intervalle: "month" as const },
  annuel: { chf: 1290, libelle: "1 290 CHF par an", intervalle: "year" as const },
} as const;

export type Formule = keyof typeof ABONNEMENT;
