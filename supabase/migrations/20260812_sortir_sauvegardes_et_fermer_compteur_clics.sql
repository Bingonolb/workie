-- ── 1. Les tables de sauvegarde quittent la surface de l'API ───────────────
--
-- Elles portent 2 495 lignes de données d'entreprises issues de nettoyages.
-- RLS est activé sans aucune politique, donc PostgREST ne renvoyait rien : il
-- n'y avait pas de fuite. Mais SELECT était accordé à `anon`, donc leur
-- structure était publiée dans le schéma de l'API, et surtout un simple
-- `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` aurait tout exposé.
--
-- Une table dont personne n'a besoin ne doit pas être à une commande d'une
-- fuite. On la déplace hors du schéma exposé plutôt que de la supprimer : ce
-- sont des sauvegardes, les détruire serait irréversible et rien ne le
-- réclame. Le schéma `sauvegardes` n'est pas exposé par PostgREST, donc ces
-- tables sont désormais inatteignables depuis l'extérieur, quelles que soient
-- leurs politiques. Vérifié : les trois répondent 404 en anonyme.
create schema if not exists sauvegardes;

revoke all on public.companies_donnees_non_verifiees_backup from anon, authenticated;
revoke all on public.companies_purge_backup                  from anon, authenticated;
revoke all on public.companies_purge_backup_2                from anon, authenticated;

alter table public.companies_donnees_non_verifiees_backup set schema sauvegardes;
alter table public.companies_purge_backup                  set schema sauvegardes;
alter table public.companies_purge_backup_2                set schema sauvegardes;

revoke all on schema sauvegardes from anon, authenticated;

-- ── 2. Le compteur de clics d'offres se ferme ──────────────────────────────
--
-- `increment_job_apply_click` est SECURITY DEFINER et n'a aucun garde-fou :
-- n'importe qui, sans compte, pouvait l'appeler en boucle via
-- /rest/v1/rpc/increment_job_apply_click et gonfler le compteur de clics de
-- n'importe quelle offre. Même faille que celle du budget publicitaire,
-- fermée le 2026-08-07.
--
-- L'application ne dépend pas de ces droits : elle appelle la fonction depuis
-- une action serveur avec la clé de service, qui les contourne. Vérifié dans
-- src/lib/actions/analytics.ts avant d'écrire cette migration, puis mesuré
-- après : 401 en anonyme, 204 avec la clé de service.
--
-- ⚠ Révoquer depuis `anon` et `authenticated` NE SUFFIT PAS. PostgreSQL
-- accorde EXECUTE à PUBLIC par défaut sur toute fonction, et ces deux rôles
-- héritent de PUBLIC : retirer leur droit nominatif laisse intact celui dont
-- ils héritent. Après la seule révocation nominative, l'appel anonyme
-- répondait encore 204. C'est lisible dans pg_proc.proacl : l'entrée
-- `=X/postgres`, bénéficiaire vide, désigne PUBLIC.
revoke execute on function public.increment_job_apply_click(uuid) from anon, authenticated;
revoke execute on function public.increment_job_apply_click(uuid) from public;
