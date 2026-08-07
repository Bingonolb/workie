-- Ferme deux fuites trouvées pendant l'audit du 2026-08-07, toutes deux
-- exploitables avec la seule clé anon — qui est publique, puisqu'elle est
-- dans le bundle client.

-- ── 1. L'IP des auteurs d'avis était publique ────────────────────────────────
--
-- Un simple GET sur /rest/v1/reviews?select=* livrait submitter_ip,
-- flag_reason, user_id et status à n'importe qui, sans passer par
-- l'application. Constaté en production : 4 avis exposaient l'IP de leur
-- auteur et 5 son user_id, alors que les 18 sont marqués anonymes.
-- L'anonymat était donc cosmétique.
--
-- src/lib/actions/columns.ts déclarait pourtant déjà l'intention
-- (« moderation-only fields — never sent to the frontend »), mais rien ne
-- l'appliquait côté base. Le frontend n'est pas une barrière : ce qui protège,
-- c'est le droit.
--
-- Effet de bord à connaître : les droits par colonne font échouer select("*")
-- — PostgREST refuse l'étoile dès qu'une colonne échappe au rôle appelant.
-- getUserReviews et l'export RGPD ont donc dû passer aux colonnes explicites,
-- et cette migration ne doit être appliquée qu'APRÈS le déploiement de ce
-- code. L'inverse casse le profil et l'export.
--
-- getFlaggedReviews, seul lecteur applicatif de submitter_ip et flag_reason,
-- passe par la clé de service et n'est pas concerné.
revoke select on public.reviews from anon, authenticated;

grant select (
  id, company_id, user_id,
  rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
  rating_flexibility, rating_recognition, rating_workload, rating_diversity,
  title, content, pros, cons, job_title, salary_chf,
  is_current, is_anonymous, employment_type, duration_range,
  work_mode, would_recommend, would_return, knew_before,
  start_year, end_year, helpful_count, created_at,
  status, is_verified_author
) on public.reviews to anon, authenticated;

-- ── 2. score_events permettait d'énumérer les comptes ────────────────────────
--
-- La politique « Anyone can read score events » était en USING (true),
-- user_id compris : on pouvait lister les utilisateurs et reconstituer, pour
-- chacun, les entreprises qu'il avait boostées — une relation
-- utilisateur↔entreprise qui doit rester privée.
--
-- Toutes les lectures de l'application filtrent déjà sur l'utilisateur courant
-- (api/company/[id]/me, api/user/context, actions/scores) : restreindre aux
-- lignes propres ne retire rien à personne.
drop policy if exists "Anyone can read score events" on public.score_events;

create policy "Users read own score events"
  on public.score_events for select
  using (user_id = (select auth.uid()));

-- Complément : user_id retiré lui aussi de la liste publique.
--
-- Chaque avis public partait avec l'identifiant de compte de son auteur. Les
-- 18 avis sont marqués anonymes, 5 portaient pourtant un user_id lisible : la
-- page annonçait « anonyme » pendant que la réponse livrait de quoi remonter
-- au compte. Aucun composant ne s'en servait — fuite pure.
--
-- Trois requêtes le filtraient, et PostgreSQL exige le droit de lecture sur
-- une colonne même pour filtrer dessus. Les fermer sans traiter ces requêtes
-- aurait neutralisé en silence la garde anti-doublon et la limite de 3 avis
-- par 24 h. Elles passent par la clé de service, avec une identité issue de
-- getUser().
revoke select on public.reviews from anon, authenticated;

grant select (
  id, company_id,
  rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
  rating_flexibility, rating_recognition, rating_workload, rating_diversity,
  title, content, pros, cons, job_title, salary_chf,
  is_current, is_anonymous, employment_type, duration_range,
  work_mode, would_recommend, would_return, knew_before,
  start_year, end_year, helpful_count, created_at,
  status, is_verified_author
) on public.reviews to anon, authenticated;
