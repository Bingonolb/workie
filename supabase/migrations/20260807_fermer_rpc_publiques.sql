-- Ferme l'accès public aux fonctions SECURITY DEFINER exposées via PostgREST.
--
-- La clé anon est publique — elle est dans le bundle client — et PostgREST
-- expose toute fonction du schéma public sur /rest/v1/rpc/<nom>. Ces fonctions
-- étaient donc appelables par n'importe qui, directement, sans passer par
-- l'application ni par aucune de ses vérifications.
--
-- Le plus grave : increment_ad_impression et increment_ad_click ajoutent le
-- coût CPM à spent_chf et clôturent la campagne quand le budget est épuisé.
-- Les identifiants de campagne circulent déjà côté client (ils servent au
-- tracking), donc n'importe qui pouvait vider le budget d'un annonceur en
-- boucle, en contournant la limite « une impression par IP par campagne
-- toutes les 10 minutes » que fait l'application.
--
-- get_campaign_*_stats laissait lire les statistiques d'un annonceur à qui
-- connaissait l'identifiant de campagne, et increment_helpful permettait de
-- gonfler le compteur « utile » d'un avis sans être connecté.
--
-- Les vérifications d'authentification et de propriété existent déjà dans les
-- actions serveur qui appellent ces fonctions ; elles ne changent pas. Ce qui
-- change, c'est que la porte de derrière se ferme : les actions passent
-- désormais par la clé de service, seule à conserver le droit d'exécution.

revoke execute on function public.increment_ad_impression(uuid)   from anon, authenticated, public;
revoke execute on function public.increment_ad_click(uuid)        from anon, authenticated, public;
revoke execute on function public.increment_helpful(uuid)         from anon, authenticated, public;
revoke execute on function public.get_campaign_daily_stats(uuid)  from anon, authenticated, public;
revoke execute on function public.get_campaign_canton_stats(uuid) from anon, authenticated, public;

grant execute on function public.increment_ad_impression(uuid)   to service_role;
grant execute on function public.increment_ad_click(uuid)        to service_role;
grant execute on function public.increment_helpful(uuid)         to service_role;
grant execute on function public.get_campaign_daily_stats(uuid)  to service_role;
grant execute on function public.get_campaign_canton_stats(uuid) to service_role;

-- Fonctions de déclencheur : elles ne sont censées être appelées que par
-- Postgres, jamais via l'API. Un appel direct échouerait de toute façon, mais
-- autant ne pas les exposer du tout.
revoke execute on function public.handle_new_user()          from anon, authenticated, public;
revoke execute on function public.handle_user_email_update() from anon, authenticated, public;

-- Plus référencée nulle part dans l'application (seul son type subsiste).
revoke execute on function public.list_distinct_brands() from anon, authenticated, public;

-- search_path figé sur les fonctions qui ne l'avaient pas. Sans lui, le
-- chemin de recherche est celui de l'appelant : sur une fonction SECURITY
-- DEFINER cela permet de détourner un appel de table ou d'opérateur vers un
-- objet fabriqué. Ces quatre-là sont SECURITY INVOKER, donc le risque est
-- théorique, mais le coût de la correction est nul.
alter function public.calc_rating_overall()            set search_path = public, pg_temp;
alter function public.protect_company_sensitive_fields() set search_path = public, pg_temp;
alter function public.recalc_company_score_on_review()   set search_path = public, pg_temp;
alter function public.update_company_stats()             set search_path = public, pg_temp;
