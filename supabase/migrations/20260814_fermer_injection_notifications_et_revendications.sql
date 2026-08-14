-- ── 1. Injection de notifications chez n'importe qui ───────────────────────
--
-- `service_insert_notifs` autorisait l'insertion à PUBLIC avec WITH CHECK
-- true, sans aucune condition sur user_id. N'importe qui, sans compte,
-- pouvait déposer une notification dans le fil de n'importe quel utilisateur,
-- avec le titre et le corps de son choix. C'est le vecteur d'hameçonnage
-- idéal : le message s'affiche à l'intérieur de l'application, là où
-- l'utilisateur fait confiance.
--
-- Mesuré avant fermeture : POST anonyme sur /rest/v1/notifications répondait
-- 201, et la ligne existait bien en base, adressée à un vrai compte.
--
-- ⚠ Le premier essai avait conclu à tort que c'était fermé. Avec l'en-tête
-- `Prefer: return=representation`, PostgREST doit aussi relire la ligne
-- insérée, ce que la politique de lecture interdit à un anonyme : la réponse
-- était une erreur RLS alors que l'écriture, elle, aurait réussi. Toujours
-- tester une écriture sans demander la représentation.
--
-- Vérifié avant de fermer : la seule insertion du code se trouve dans
-- src/lib/actions/notifications.ts et passe par la clé de service, qui
-- contourne les politiques. Mesuré après : 401 en anonyme, 201 avec la clé de
-- service.
drop policy if exists "service_insert_notifs" on public.notifications;

-- ── 2. Revendications d'entreprise déposées sans compte ────────────────────
--
-- `allow_public_insert_company_claims` accordait l'insertion au rôle anon
-- avec WITH CHECK true. Aucune identité, aucune limite : de quoi noyer la
-- file de modération et y faire figurer les coordonnées de son choix au nom
-- de n'importe quelle entreprise.
--
-- Aucune insertion de company_claims n'existe dans le code. La politique
-- `claims_insert`, qui exige une session et impose user_id = auth.uid(),
-- reste en place pour l'usage légitime.
drop policy if exists "allow_public_insert_company_claims" on public.company_claims;

-- ── 3. Clics sur les offres d'emploi ───────────────────────────────────────
--
-- Même cas que le compteur fermé le 2026-08-12 : l'application écrit ces
-- lignes avec la clé de service depuis une action serveur. Le droit anonyme
-- ne servait qu'à laisser gonfler les statistiques que les entreprises
-- regardent.
--
-- Les trois autres tables de suivi — ad_impressions, ad_clicks,
-- company_views — gardent le leur : elles sont écrites en tant que visiteur,
-- et le retirer casserait la mesure pour les personnes non connectées.
-- Vérifié après coup : company_views répond toujours 201 en anonyme.
drop policy if exists "anyone_insert_job_click" on public.job_apply_clicks;
