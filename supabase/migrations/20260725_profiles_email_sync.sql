-- ════════════════════════════════════════════════════════════════════════════
-- profiles.email — single source of truth, kept in sync with auth.users
--
-- Rationale: admin panel queries (getClaims, getReports) were doing N calls
-- to auth.admin.getUserById() to resolve email addresses. At 100K users this
-- hits the Supabase Auth Admin API rate limit. Storing email in profiles
-- turns those N HTTP calls into a single SQL JOIN.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Add column (nullable — populated by trigger and backfill below)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill all existing users from auth.users (runs under definer rights)
UPDATE public.profiles p
SET    email = u.email
FROM   auth.users u
WHERE  u.id = p.id
  AND  p.email IS NULL;

-- 3. Update handle_new_user: populate email on every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
      || '_' || substr(new.id::text, 1, 4),
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- 4. New trigger: keep profiles.email in sync when the user changes their
--    auth email (via supabase.auth.updateUser or email confirmation flow)
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF new.email IS DISTINCT FROM old.email THEN
    UPDATE public.profiles SET email = new.email WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- 5. Harden profiles_update_own: prevent users from overwriting their
--    email via a direct SQL UPDATE (must go through auth, which triggers sync)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    -- role must not self-escalate
    AND role = (SELECT role FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()))
    -- claimed_company_id is immutable from user side
    AND NOT (claimed_company_id IS DISTINCT FROM (
      SELECT claimed_company_id FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid())
    ))
    -- email is managed by the auth trigger, not by the user directly
    AND NOT (email IS DISTINCT FROM (
      SELECT email FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid())
    ))
  );
