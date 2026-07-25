-- ============================================================
-- Workie — Review Trust System
-- 2026-07-25
-- ============================================================

-- ── 1. FIX RLS UPDATE on reviews ──────────────────────────────────────────────
-- The previous policy had USING but no WITH CHECK, allowing a user to change
-- company_id or user_id on their own review via direct PostgREST calls.
-- Since there is no review editing feature, we DROP the policy entirely.
-- The admin client (SECURITY DEFINER functions like increment_helpful) bypasses
-- RLS and continues to work. If an edit feature is added later, restore this
-- policy with a proper WITH CHECK that constrains immutable columns.

DROP POLICY IF EXISTS "reviews_own" ON public.reviews;

-- ── 2. FIX RLS UPDATE on profiles — block self-assignment of claimed_company_id ──
-- The previous policy only blocked role escalation. A user could call PostgREST
-- directly with their JWT and set claimed_company_id to any company UUID,
-- effectively gaining business-account access without going through admin approval.
-- Only the service-role client (admin claim approval flow) should be able to set it.

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role cannot be self-escalated
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    -- claimed_company_id cannot be self-assigned; only admin sets it via service role
    AND claimed_company_id IS NOT DISTINCT FROM (
      SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ── 3. ADD trust columns to reviews ───────────────────────────────────────────

-- status: lifecycle of a review (published by default, can be flagged or removed)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'flagged', 'removed'));

-- submitter_ip: IP at submission time, stored for fraud/abuse auditing
-- Stored as TEXT (not INET) to avoid PostgREST serialization issues
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS submitter_ip TEXT;

-- flag_reason: why the review was auto-flagged (null if published normally)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- is_verified_author: denormalized from profiles.identity_verified at write time
-- Avoids a join on every review fetch; correct at submission, never changes
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_verified_author BOOLEAN NOT NULL DEFAULT false;

-- ── 4. UPDATE company stats trigger — only count published reviews ─────────────
-- Previously counted all reviews. Now excludes flagged and removed ones so that
-- a wave of flagged fake reviews doesn't inflate avg_rating or review_count.

CREATE OR REPLACE FUNCTION public.update_company_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cid            uuid;
  new_avg_rating numeric;
  new_count      integer;
  new_salary     numeric;
  new_score      integer;
BEGIN
  cid := COALESCE(NEW.company_id, OLD.company_id);

  SELECT
    COALESCE(ROUND(AVG(rating_overall)::numeric, 2), 0),
    COUNT(*),
    ROUND(AVG(salary_chf)::numeric, -3)
  INTO new_avg_rating, new_count, new_salary
  FROM public.reviews
  WHERE company_id = cid
    AND COALESCE(status, 'published') = 'published';

  new_score :=
    ROUND(new_avg_rating * 20.0 * LN(new_count + 1))::integer
    + COALESCE(
        (SELECT SUM(points) FROM public.score_events WHERE company_id = cid),
        0
      );

  UPDATE public.companies SET
    avg_rating     = new_avg_rating,
    review_count   = new_count,
    avg_salary_chf = new_salary,
    score          = new_score
  WHERE id = cid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── 5. INDEXES for new columns and trust queries ───────────────────────────────

-- Filter by status (main public query: WHERE company_id = ? AND status = 'published')
CREATE INDEX IF NOT EXISTS idx_reviews_company_status
  ON public.reviews(company_id, status);

-- IP abuse detection: all reviews from same IP for same company
CREATE INDEX IF NOT EXISTS idx_reviews_ip_company
  ON public.reviews(submitter_ip, company_id)
  WHERE submitter_ip IS NOT NULL;

-- Admin: fetch all flagged reviews quickly
CREATE INDEX IF NOT EXISTS idx_reviews_status_flagged
  ON public.reviews(status, created_at DESC)
  WHERE status = 'flagged';

-- ── 6. CREATE reports table (was created manually in Supabase, now tracked) ────
-- This migration is safe to run even if the table already exists.

CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('review', 'company', 'profile')),
  target_id   TEXT NOT NULL,
  target_label TEXT,
  category    TEXT NOT NULL,
  explanation TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'content_deleted'))
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own reports (for deduplication check in submitReport)
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_reporter
  ON public.reports(reporter_id, created_at DESC)
  WHERE reporter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_target
  ON public.reports(target_type, target_id);
