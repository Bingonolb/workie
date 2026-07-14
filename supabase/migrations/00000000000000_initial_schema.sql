-- ============================================================
-- Workie — Initial schema
-- Generated from live DB: 2026-07-14
-- Apply via: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zefix_uid              TEXT UNIQUE,
  name                   TEXT NOT NULL,
  sector                 TEXT NOT NULL,
  subsector              TEXT,
  city                   TEXT NOT NULL,
  canton                 TEXT,
  employee_range         TEXT DEFAULT '51-200',
  description            TEXT,
  logo_url               TEXT,
  cover_url              TEXT,
  website_url            TEXT,
  linkedin_url           TEXT,
  twitter_url            TEXT,
  instagram_url          TEXT,
  founded_year           INTEGER,
  avg_salary_chf         INTEGER,
  avg_rating             NUMERIC DEFAULT 0,
  review_count           INTEGER DEFAULT 0,
  tags                   TEXT[] DEFAULT '{}',
  is_verified            BOOLEAN DEFAULT false,
  is_subscribed          BOOLEAN DEFAULT false,
  subscription_ends_at   TIMESTAMPTZ,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  score                  INTEGER NOT NULL DEFAULT 0,
  claimed_by             UUID REFERENCES auth.users(id),
  created_at             TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id                              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                        TEXT NOT NULL UNIQUE,
  full_name                       TEXT,
  avatar_url                      TEXT,
  city                            TEXT,
  canton                          TEXT,
  country                         TEXT,
  bio                             TEXT,
  role                            TEXT NOT NULL DEFAULT 'user',
  identity_verified               BOOLEAN NOT NULL DEFAULT false,
  identity_verified_at            TIMESTAMPTZ,
  stripe_verification_session_id  TEXT,
  claimed_company_id              UUID REFERENCES public.companies(id),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating_overall    NUMERIC NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_culture    NUMERIC,
  rating_management NUMERIC,
  rating_worklife   NUMERIC,
  rating_career     NUMERIC,
  title             TEXT,
  content           TEXT NOT NULL,
  pros              TEXT,
  cons              TEXT,
  job_title         TEXT,
  salary_chf        INTEGER,
  is_current        BOOLEAN DEFAULT true,
  is_anonymous      BOOLEAN DEFAULT true,
  helpful_count     INTEGER DEFAULT 0,
  employment_type   TEXT DEFAULT 'cdi' CHECK (employment_type IN ('cdi','cdd','stage','alternance','freelance')),
  duration_range    TEXT CHECK (duration_range IN ('moins_6mois','6mois_2ans','plus_2ans')),
  work_mode         TEXT CHECK (work_mode IN ('présentiel','hybride','remote')),
  would_recommend   TEXT CHECK (would_recommend IN ('oui','non','ca_depend')),
  knew_before       TEXT,
  start_year        INTEGER,
  end_year          INTEGER,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_votes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id  UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, review_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.score_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('flame','boost','penalty')),
  points     INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  company_website  TEXT,
  employee_range   TEXT,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  job_title        TEXT NOT NULL,
  job_level        TEXT NOT NULL,
  work_email       TEXT NOT NULL,
  message          TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  user_id          UUID REFERENCES auth.users(id),
  company_id       UUID REFERENCES public.companies(id),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES auth.users(id),
  zefix_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) >= 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_offers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  location         TEXT,
  contract_type    TEXT CHECK (contract_type IN ('CDI','CDD','Stage','Alternance','Freelance')),
  salary_range     TEXT,
  is_active        BOOLEAN DEFAULT true,
  experience_level TEXT,
  work_mode        TEXT,
  requirements     TEXT,
  apply_url        TEXT,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  format           TEXT NOT NULL CHECK (format IN ('square','swipe')),
  image_url        TEXT NOT NULL,
  headline         TEXT NOT NULL,
  body_text        TEXT,
  cta_label        TEXT NOT NULL DEFAULT 'En savoir plus',
  cta_url          TEXT NOT NULL,
  target_cantons   TEXT[] NOT NULL DEFAULT '{}',
  target_sectors   TEXT[] NOT NULL DEFAULT '{}',
  daily_budget_chf NUMERIC NOT NULL,
  total_budget_chf NUMERIC NOT NULL,
  spent_chf        NUMERIC NOT NULL DEFAULT 0,
  cpm_chf          NUMERIC NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','completed','rejected')),
  admin_note       TEXT,
  impression_count INTEGER NOT NULL DEFAULT 0,
  click_count      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_canton TEXT,
  viewer_city   TEXT,
  viewed_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_canton TEXT,
  clicked_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reviews_company_id       ON public.reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id          ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_company_views_company_id ON public.company_views(company_id);
CREATE INDEX IF NOT EXISTS idx_company_views_viewed_at  ON public.company_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign  ON public.ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_canton    ON public.ad_impressions(viewer_canton) WHERE viewer_canton IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign       ON public.ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_canton         ON public.ad_clicks(viewer_canton) WHERE viewer_canton IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_score_events_company     ON public.score_events(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_sector         ON public.companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_canton         ON public.companies(canton);
CREATE INDEX IF NOT EXISTS idx_companies_score          ON public.companies(score DESC);

-- Trigram index for fast ILIKE search
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON public.companies USING gin(name gin_trgm_ops);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Increment helpful_count atomically
CREATE OR REPLACE FUNCTION public.increment_helpful(review_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.reviews SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = review_id;
$$;

-- Increment ad impression + deduct CPM cost + auto-complete when budget exhausted
CREATE OR REPLACE FUNCTION public.increment_ad_impression(p_campaign_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.ad_campaigns
  SET
    impression_count = impression_count + 1,
    spent_chf        = spent_chf + cpm_chf / 1000.0,
    status           = CASE WHEN spent_chf + cpm_chf / 1000.0 >= total_budget_chf THEN 'completed' ELSE status END
  WHERE id = p_campaign_id;
$$;

-- Increment ad click count
CREATE OR REPLACE FUNCTION public.increment_ad_click(p_campaign_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.ad_campaigns SET click_count = click_count + 1 WHERE id = p_campaign_id;
$$;

-- Updates avg_rating, review_count, avg_salary_chf and score on every review change
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
  FROM reviews WHERE company_id = cid;

  new_score := ROUND(new_avg_rating * 20.0 * LN(new_count + 1))::integer
    + COALESCE((SELECT SUM(points) FROM score_events WHERE company_id = cid), 0);

  UPDATE companies SET
    avg_rating     = new_avg_rating,
    review_count   = new_count,
    avg_salary_chf = new_salary,
    score          = new_score
  WHERE id = cid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_company_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_company_stats();

-- Updates companies.score on every flame/boost/penalty event
CREATE OR REPLACE FUNCTION public.update_company_score()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cid       uuid;
  new_score integer;
BEGIN
  cid := COALESCE(NEW.company_id, OLD.company_id);

  SELECT ROUND(
    COALESCE(avg_rating, 0) * 20.0 * LN(COALESCE(review_count, 0) + 1)
  )::integer
  + COALESCE((SELECT SUM(points) FROM score_events WHERE company_id = cid), 0)
  INTO new_score
  FROM companies WHERE id = cid;

  UPDATE companies SET score = COALESCE(new_score, 0) WHERE id = cid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER on_score_event
  AFTER INSERT OR DELETE ON public.score_events
  FOR EACH ROW EXECUTE FUNCTION update_company_score();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_claims  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks       ENABLE ROW LEVEL SECURITY;

-- companies: public read, admin write
CREATE POLICY "companies_read"   ON public.companies FOR SELECT USING (true);

-- profiles: own read/write
CREATE POLICY "profiles_own"     ON public.profiles FOR ALL USING (auth.uid() = id);

-- reviews: public read, authenticated write (own)
CREATE POLICY "reviews_read"     ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert"   ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_own"      ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete"   ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- review_votes: own
CREATE POLICY "votes_own"        ON public.review_votes FOR ALL USING (auth.uid() = user_id);

-- favorites: own
CREATE POLICY "favorites_own"    ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- score_events: own read, authenticated insert
CREATE POLICY "score_read"       ON public.score_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "score_insert"     ON public.score_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "score_delete"     ON public.score_events FOR DELETE USING (auth.uid() = user_id);

-- company_claims: anyone can insert, own read
CREATE POLICY "claims_insert"    ON public.company_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "claims_own_read"  ON public.company_claims FOR SELECT USING (auth.uid() = user_id);

-- company_replies: public read, business write
CREATE POLICY "replies_read"     ON public.company_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert"   ON public.company_replies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND claimed_company_id = company_id)
);

-- company_views: anyone inserts, business reads own
CREATE POLICY "views_insert"     ON public.company_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views_business"   ON public.company_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND claimed_by = auth.uid())
);

-- job_offers: public read, business write
CREATE POLICY "jobs_read"        ON public.job_offers FOR SELECT USING (true);
CREATE POLICY "jobs_business"    ON public.job_offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND claimed_by = auth.uid())
);

-- ad_campaigns: active public read, business write
CREATE POLICY "ads_active_read"  ON public.ad_campaigns FOR SELECT USING (status = 'active' OR claimed_by = auth.uid())
  USING (
    status = 'active' OR
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND claimed_by = auth.uid())
  );
CREATE POLICY "ads_business"     ON public.ad_campaigns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND claimed_by = auth.uid())
);

-- ad_impressions / ad_clicks: anyone inserts
CREATE POLICY "impressions_insert" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "clicks_insert"      ON public.ad_clicks      FOR INSERT WITH CHECK (true);
