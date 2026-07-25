-- ══════════════════════════════════════════════════════════════════
-- Performance: missing FK indexes + RLS auth_rls_initplan fix
--
-- Supabase advisors flagged:
--   • 9 foreign keys without covering indexes (seq scans on cascades)
--   • 25+ RLS policies calling auth.uid() per-row instead of per-statement
--
-- Fix: add CONCURRENTLY indexes + replace auth.uid() with (select auth.uid())
-- Impact: eliminates per-row function evaluation on every authenticated query.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. FK INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id
  ON public.ad_campaigns (user_id);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_user_id
  ON public.ad_clicks (user_id);

CREATE INDEX IF NOT EXISTS idx_companies_claimed_by
  ON public.companies (claimed_by)
  WHERE claimed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_claims_company_id
  ON public.company_claims (company_id);

CREATE INDEX IF NOT EXISTS idx_company_claims_reviewed_by
  ON public.company_claims (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_claims_user_id
  ON public.company_claims (user_id);

CREATE INDEX IF NOT EXISTS idx_company_replies_company_id
  ON public.company_replies (company_id);

CREATE INDEX IF NOT EXISTS idx_company_views_user_id
  ON public.company_views (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id
  ON public.review_votes (review_id);


-- ── 2. RLS auth_rls_initplan FIX ──────────────────────────────────
-- Every auth.uid() call in a USING/WITH CHECK clause is evaluated
-- once per row by default. Wrapping it in (select auth.uid()) tells
-- the planner it's a stable sub-select: evaluated once per statement.

-- ad_campaigns
DROP POLICY IF EXISTS "ads_active_read"               ON public.ad_campaigns;
DROP POLICY IF EXISTS "business_insert_own_campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "business_view_own_campaigns"   ON public.ad_campaigns;
DROP POLICY IF EXISTS "user_insert_own_campaigns"     ON public.ad_campaigns;
DROP POLICY IF EXISTS "user_view_own_campaigns"       ON public.ad_campaigns;

CREATE POLICY "ads_active_read" ON public.ad_campaigns
  FOR SELECT USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = ad_campaigns.company_id
        AND companies.claimed_by = (SELECT auth.uid())
    )
  );
CREATE POLICY "business_insert_own_campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (
    company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
  );
CREATE POLICY "business_view_own_campaigns" ON public.ad_campaigns
  FOR SELECT USING (
    company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
  );
CREATE POLICY "user_insert_own_campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()) AND company_id IS NULL
  );
CREATE POLICY "user_view_own_campaigns" ON public.ad_campaigns
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ad_clicks
DROP POLICY IF EXISTS "business_view_own_clicks" ON public.ad_clicks;
CREATE POLICY "business_view_own_clicks" ON public.ad_clicks
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns
      WHERE company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ad_impressions
DROP POLICY IF EXISTS "business_view_own_impressions" ON public.ad_impressions;
CREATE POLICY "business_view_own_impressions" ON public.ad_impressions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns
      WHERE company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- companies
DROP POLICY IF EXISTS "admin_companies_write"       ON public.companies;
DROP POLICY IF EXISTS "business_update_own_company" ON public.companies;
CREATE POLICY "admin_companies_write" ON public.companies
  FOR ALL
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "business_update_own_company" ON public.companies
  FOR UPDATE
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND claimed_company_id = companies.id))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND claimed_company_id = companies.id));

-- company_claims
DROP POLICY IF EXISTS "claims_admin"      ON public.company_claims;
DROP POLICY IF EXISTS "claims_insert"     ON public.company_claims;
DROP POLICY IF EXISTS "claims_select_own" ON public.company_claims;
CREATE POLICY "claims_admin" ON public.company_claims
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "claims_insert" ON public.company_claims
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()));
CREATE POLICY "claims_select_own" ON public.company_claims
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- company_replies
DROP POLICY IF EXISTS "replies_insert_owner" ON public.company_replies;
DROP POLICY IF EXISTS "replies_update"       ON public.company_replies;
CREATE POLICY "replies_insert_owner" ON public.company_replies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND claimed_company_id = company_replies.company_id)
  );
CREATE POLICY "replies_update" ON public.company_replies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND claimed_company_id = company_replies.company_id)
  );

-- company_views
DROP POLICY IF EXISTS "admin_view_all_views"            ON public.company_views;
DROP POLICY IF EXISTS "business_view_own_company_views" ON public.company_views;
CREATE POLICY "admin_view_all_views" ON public.company_views
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
CREATE POLICY "business_view_own_company_views" ON public.company_views
  FOR SELECT USING (
    company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- favorites
DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own" ON public.favorites
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- job_apply_clicks
DROP POLICY IF EXISTS "biz_read_own_job_clicks" ON public.job_apply_clicks;
CREATE POLICY "biz_read_own_job_clicks" ON public.job_apply_clicks
  FOR SELECT USING (
    company_id IN (SELECT claimed_company_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- job_offers
DROP POLICY IF EXISTS "jobs_crud_owner" ON public.job_offers;
CREATE POLICY "jobs_crud_owner" ON public.job_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND claimed_company_id = job_offers.company_id)
  );

-- notifications
DROP POLICY IF EXISTS "users_delete_own_notifs" ON public.notifications;
DROP POLICY IF EXISTS "users_read_own_notifs"   ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifs" ON public.notifications;
CREATE POLICY "users_delete_own_notifs" ON public.notifications FOR DELETE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "users_read_own_notifs"   ON public.notifications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "users_update_own_notifs" ON public.notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- profiles
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND role = (SELECT role FROM profiles p2 WHERE p2.id = (SELECT auth.uid()))
    AND NOT (claimed_company_id IS DISTINCT FROM (
      SELECT claimed_company_id FROM profiles p2 WHERE p2.id = (SELECT auth.uid())
    ))
  );

-- reports — also consolidates two overlapping INSERT and two overlapping SELECT policies
DROP POLICY IF EXISTS "Users can submit reports"   ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "reports_insert"             ON public.reports;
DROP POLICY IF EXISTS "reports_select_own"         ON public.reports;
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND reporter_id = (SELECT auth.uid())
  );
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (reporter_id = (SELECT auth.uid()));

-- review_votes
DROP POLICY IF EXISTS "votes_own" ON public.review_votes;
CREATE POLICY "votes_own" ON public.review_votes
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- reviews
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
  );

-- score_events
DROP POLICY IF EXISTS "Users delete own events" ON public.score_events;
DROP POLICY IF EXISTS "Users insert own events" ON public.score_events;
CREATE POLICY "Users delete own events" ON public.score_events
  FOR DELETE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users insert own events" ON public.score_events
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
