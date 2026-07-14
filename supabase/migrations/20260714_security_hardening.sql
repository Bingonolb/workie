-- ============================================================
-- Workie — Security Hardening
-- ============================================================

-- ── 1. PROFILES: prevent privilege escalation ──────────────────────────────
-- The blanket "FOR ALL" policy let any user UPDATE their own role to 'admin'.
-- Split into granular policies that lock the role column.

DROP POLICY IF EXISTS "profiles_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE allowed only when role is unchanged
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ── 2. AD_CAMPAIGNS: fix malformed SELECT policy ───────────────────────────
-- The original policy had two USING clauses (invalid SQL) and referenced
-- a non-existent column 'claimed_by' on ad_campaigns.

DROP POLICY IF EXISTS "ads_active_read" ON public.ad_campaigns;

CREATE POLICY "ads_active_read"
  ON public.ad_campaigns FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND claimed_by = auth.uid()
    )
  );

-- Business can also see their own pending/paused/rejected campaigns
-- (covered by the EXISTS clause above)

-- ── 3. SCORE_EVENTS: DB-level dedup ────────────────────────────────────────
-- The application already checks before inserting, but a user with a raw JWT
-- could bypass Server Actions and insert duplicates via PostgREST.
-- This constraint is the safety net.

ALTER TABLE public.score_events
  DROP CONSTRAINT IF EXISTS score_events_unique_user_company_type;

ALTER TABLE public.score_events
  ADD CONSTRAINT score_events_unique_user_company_type
  UNIQUE (user_id, company_id, event_type);

-- ── 4. COMPANY_CLAIMS: require authentication ──────────────────────────────
-- Unauthenticated bots were able to spam claim requests.

DROP POLICY IF EXISTS "claims_insert" ON public.company_claims;

CREATE POLICY "claims_insert"
  ON public.company_claims FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ── 5. PROFILES: allow companies to read their claimer's profile ───────────
-- Needed for business dashboard to read the claimer's profile info.
-- Scoped: only companies where claimed_by = auth.uid() can read the profile.
-- (This is already handled by the profiles_select_own policy for the owner;
--  this is a no-op clarification — no additional policy needed.)

-- ── 6. AD_IMPRESSIONS / AD_CLICKS: prevent read by anonymous ───────────────
-- Already correct: no SELECT policy means no one can read them except admin.

-- ── 7. REVIEWS: prevent same user from voting helpful twice ────────────────
-- Already enforced by the PK (user_id, review_id). No change needed.

-- ── 8. COMPANY_REPLIES: allow business UPDATE (for editing replies) ─────────
DROP POLICY IF EXISTS "replies_update" ON public.company_replies;

CREATE POLICY "replies_update"
  ON public.company_replies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND claimed_company_id = company_id
    )
  );

-- ── 9. JOB_OFFERS: prevent claimed_by bypass ───────────────────────────────
-- The jobs_business policy already uses companies.claimed_by = auth.uid(). OK.
