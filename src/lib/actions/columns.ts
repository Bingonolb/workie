// Column selectors for public-facing queries.
// Kept separate from "use server" files — Next.js forbids non-async exports there.

// submitter_ip and flag_reason are moderation-only fields — never sent to the frontend.
// ATTENTION : toute nouvelle colonne d'avis destinée à l'affichage doit être
// ajoutée ici, sinon elle est écrite en base mais jamais relue — le champ
// apparaît vide côté public sans qu'aucune erreur ne soit levée.
// Couvert par src/__tests__/smoke.test.ts.
// user_id volontairement absent. Aucun composant ne l'affichait, et le laisser
// partait avec chaque avis public : la page annonçait « anonyme » pendant que
// la réponse livrait l'identifiant de compte de l'auteur. L'anonymat était
// cosmétique. Les requêtes qui filtrent sur user_id passent désormais par la
// clé de service, seule à conserver le droit de lecture sur cette colonne.
export const REVIEW_PUBLIC_COLS = [
  "id", "company_id",
  "rating_overall", "rating_culture", "rating_management", "rating_worklife", "rating_career",
  "rating_flexibility", "rating_recognition", "rating_workload", "rating_diversity",
  "title", "content", "pros", "cons", "job_title", "salary_chf",
  "is_current", "is_anonymous", "employment_type", "duration_range",
  "work_mode", "would_recommend", "would_return", "knew_before",
  "start_year", "end_year", "helpful_count", "created_at",
  "status", "is_verified_author",
].join(",");

// Colonnes envoyées à la fiche publique d'une entreprise.
//
// Le texte des avis — titre, contenu, points positifs et négatifs — en est
// volontairement absent. La plateforme ne l'affiche pas, mais il partait
// malgré tout dans les données de la page : invisible à l'écran, parfaitement
// lisible dans le code source. Ne pas afficher n'est pas ne pas transmettre.
//
// Ces champs restent disponibles pour l'auteur de l'avis, via son profil et
// son export, et pour la modération, qui passe par la clé de service.
export const REVIEW_FICHE_COLS = REVIEW_PUBLIC_COLS
  .split(",")
  .filter(c => !["title", "content", "pros", "cons"].includes(c))
  .join(",");

export const GRID_PAGE_SIZE = 24;

// Stripe billing, subscription internals, and claimed_by are admin-only fields
// and must never reach the public company page.
export const COMPANY_PUBLIC_COLS = [
  "id", "name", "sector", "subsector", "city", "canton", "employee_range",
  "description", "logo_url", "cover_url", "cover_color", "website_url", "linkedin_url",
  "twitter_url", "instagram_url", "founded_year", "avg_salary_chf",
  "avg_rating", "review_count", "tags", "is_verified", "is_subscribed",
  "score", "profile_score", "created_at", "zefix_uid",
].join(",");
