-- Ad campaigns table
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  format            TEXT        NOT NULL CHECK (format IN ('square', 'swipe')),
  image_url         TEXT        NOT NULL,
  headline          TEXT        NOT NULL,
  body_text         TEXT,
  cta_label         TEXT        NOT NULL DEFAULT 'En savoir plus',
  cta_url           TEXT        NOT NULL,
  target_cantons    TEXT[]      NOT NULL DEFAULT '{}',
  target_sectors    TEXT[]      NOT NULL DEFAULT '{}',
  daily_budget_chf  NUMERIC(10,2) NOT NULL,
  total_budget_chf  NUMERIC(10,2) NOT NULL,
  spent_chf         NUMERIC(10,2) NOT NULL DEFAULT 0,
  cpm_chf           NUMERIC(10,4) NOT NULL,
  start_date        DATE        NOT NULL,
  end_date          DATE,
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','paused','completed','rejected')),
  admin_note        TEXT,
  impression_count  INTEGER     NOT NULL DEFAULT 0,
  click_count       INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Ad impressions table
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID        NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at    TIMESTAMPTZ DEFAULT now()
);

-- Ad clicks table
CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID        NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  clicked_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_company  ON public.ad_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status   ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_camp   ON public.ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_camp        ON public.ad_clicks(campaign_id);

-- Atomic increment functions
CREATE OR REPLACE FUNCTION public.increment_ad_impression(p_campaign_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.ad_campaigns
  SET impression_count = impression_count + 1
  WHERE id = p_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(p_campaign_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.ad_campaigns
  SET click_count = click_count + 1
  WHERE id = p_campaign_id;
END;
$$;

-- Row Level Security
ALTER TABLE public.ad_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks      ENABLE ROW LEVEL SECURITY;

-- Business: read own campaigns
CREATE POLICY "business_view_own_campaigns" ON public.ad_campaigns
  FOR SELECT USING (
    company_id IN (
      SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Business: create own campaigns
CREATE POLICY "business_insert_own_campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Public: read active campaigns (for ad serving)
CREATE POLICY "public_read_active_campaigns" ON public.ad_campaigns
  FOR SELECT USING (status = 'active');

-- Anyone can insert impressions (tracking)
CREATE POLICY "anyone_insert_impressions" ON public.ad_impressions
  FOR INSERT WITH CHECK (true);

-- Anyone can insert clicks (tracking)
CREATE POLICY "anyone_insert_clicks" ON public.ad_clicks
  FOR INSERT WITH CHECK (true);
