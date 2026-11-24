/** Une offre telle qu'elle s'affiche, côté navigateur comme côté serveur. */
export type OffreAffichee = {
  id: string; title: string; location: string | null; contract_type: string | null;
  taux_min: number | null; taux_max: number | null; langue: string | null;
  apply_url: string | null; apercu: string | null; created_at: string | null;
  // Pour l'aperçu de l'offre, le même que sur la fiche entreprise.
  description: string | null; missions: string | null; requirements: string | null; avantages: string | null;
  work_mode: string | null; experience_level: string | null; entree: string | null; langues: string[] | null; source: string | null;
  /** Fermée par l'employeur ou expirée : montrée grisée dans les favoris. */
  cloturee: boolean;
  entreprise: {
    id: string; slug: string | null; name: string; logo_url: string | null; cover_url: string | null;
    cover_color: string | null; sector: string | null; subsector: string | null; city: string | null; canton: string | null;
  };
};
