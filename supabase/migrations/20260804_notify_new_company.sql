-- Notifie tous les membres quand une entreprise est ajoutée au catalogue.
--
-- Remplace l'ancien flux de notifications (offres d'emploi via Workie Business,
-- qui n'existe plus). Regroupe volontairement : si un utilisateur a déjà une
-- notification "new_companies" non lue de moins de 24h, la nouvelle entreprise
-- y est ajoutée au lieu de créer une 2e ligne. Ajouter 30 entreprises d'affilée
-- produit donc UNE notification listant les entreprises (plafonnée à 12), pas 30.
--
-- Note montée en charge : le fan-out écrit une ligne par utilisateur. À la
-- volumétrie actuelle (dizaines d'utilisateurs) c'est négligeable ; au-delà de
-- ~50k utilisateurs il faudra passer à une table d'annonces globale avec suivi
-- de lecture par utilisateur plutôt qu'une ligne par destinataire.
CREATE OR REPLACE FUNCTION public.notify_new_company(
  p_company_id     uuid,
  p_company_name   text,
  p_company_sector text DEFAULT NULL,
  p_company_city   text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_entry    jsonb;
  v_window   timestamptz := now() - interval '24 hours';
  v_max      int := 12;
  v_updated  int := 0;
  v_inserted int := 0;
BEGIN
  v_entry := jsonb_build_object(
    'id',     p_company_id,
    'name',   p_company_name,
    'sector', p_company_sector,
    'city',   p_company_city
  );

  -- 1) Compléter les digests déjà ouverts (récents, non lus, non pleins,
  --    et ne contenant pas déjà cette entreprise).
  UPDATE public.notifications n
     SET data  = jsonb_set(n.data, '{companies}', (n.data -> 'companies') || v_entry),
         title = (jsonb_array_length(n.data -> 'companies') + 1)::text
                 || ' nouvelles entreprises sur Workie'
   WHERE n.type = 'new_companies'
     AND n.read = false
     AND n.created_at >= v_window
     AND jsonb_typeof(n.data -> 'companies') = 'array'
     AND jsonb_array_length(n.data -> 'companies') < v_max
     AND NOT (n.data -> 'companies') @> jsonb_build_array(
           jsonb_build_object('id', p_company_id));
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- 2) Créer un digest neuf pour ceux qui n'en avaient pas d'ouvert
  --    (jamais eu, déjà lu, trop ancien, ou plein).
  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  SELECT p.id,
         'new_companies',
         'Nouvelle entreprise sur Workie',
         NULL,
         jsonb_build_object('companies', jsonb_build_array(v_entry)),
         false
    FROM public.profiles p
   WHERE NOT EXISTS (
           SELECT 1
             FROM public.notifications n
            WHERE n.user_id = p.id
              AND n.type = 'new_companies'
              AND n.read = false
              AND n.created_at >= v_window
              AND jsonb_typeof(n.data -> 'companies') = 'array'
              AND jsonb_array_length(n.data -> 'companies') < v_max
         );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN v_updated + v_inserted;
END;
$$;

-- Réservé au service role (appelé depuis adminAddCompany) : un utilisateur
-- authentifié ne doit pas pouvoir déclencher un fan-out de notifications.
REVOKE ALL ON FUNCTION public.notify_new_company(uuid, text, text, text)
  FROM public, anon, authenticated;

-- Accélère le NOT EXISTS du fan-out et le comptage des non-lues.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, type, created_at DESC)
  WHERE read = false;
