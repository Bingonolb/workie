// Source unique des catégories notées d'un avis.
//
// Consommée par la fiche entreprise (synthèse + carte d'avis) et par les tests,
// qui vérifient que chaque clé est bien sélectionnée dans REVIEW_PUBLIC_COLS.
// Sans ce garde-fou, ajouter une catégorie à l'interface sans l'ajouter à la
// liste de colonnes la fait apparaître vide côté public : la donnée est écrite
// en base mais jamais relue, et aucune erreur n'est levée.
export const RATING_CATEGORIES = [
  { key: "rating_management",  label: "Management" },
  { key: "rating_worklife",    label: "Vie pro / perso" },
  { key: "rating_culture",     label: "Ambiance & culture" },
  { key: "rating_career",      label: "Évolution" },
  { key: "rating_flexibility", label: "Flexibilité" },
  { key: "rating_recognition", label: "Reconnaissance" },
  { key: "rating_workload",    label: "Charge de travail" },
  { key: "rating_diversity",   label: "Diversité & inclusion" },
] as const;

export type RatingCategoryKey = (typeof RATING_CATEGORIES)[number]["key"];
