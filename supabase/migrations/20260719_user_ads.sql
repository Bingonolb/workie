-- Allow individual users (non-business) to create ad campaigns
-- Adds user_id column to ad_campaigns; either company_id or user_id is set, never both.

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS: users can see their own campaigns
CREATE POLICY "user_view_own_campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (user_id = auth.uid());

-- RLS: users can insert campaigns with their user_id (company_id must be null)
CREATE POLICY "user_insert_own_campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid() AND company_id IS NULL);

-- Update the daily stats RPC to also allow user-owned campaigns
CREATE OR REPLACE FUNCTION public.get_campaign_daily_stats(p_campaign_id UUID)
RETURNS TABLE(day DATE, impressions BIGINT, clicks BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ad_campaigns ac
    JOIN profiles p ON p.claimed_company_id = ac.company_id
    WHERE ac.id = p_campaign_id AND p.id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM ad_campaigns WHERE id = p_campaign_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.day,
    COALESCE(i.cnt, 0)::BIGINT AS impressions,
    COALESCE(c.cnt, 0)::BIGINT AS clicks
  FROM (
    SELECT generate_series(
      (CURRENT_DATE - INTERVAL '29 days')::date,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS day
  ) d
  LEFT JOIN (
    SELECT DATE(viewed_at AT TIME ZONE 'Europe/Zurich') AS day, COUNT(*) AS cnt
    FROM ad_impressions
    WHERE campaign_id = p_campaign_id
      AND viewed_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
  ) i ON i.day = d.day
  LEFT JOIN (
    SELECT DATE(clicked_at AT TIME ZONE 'Europe/Zurich') AS day, COUNT(*) AS cnt
    FROM ad_clicks
    WHERE campaign_id = p_campaign_id
      AND clicked_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
  ) c ON c.day = d.day
  ORDER BY d.day;
END;
$$;

-- Update the canton stats RPC similarly
CREATE OR REPLACE FUNCTION public.get_campaign_canton_stats(p_campaign_id UUID)
RETURNS TABLE(canton TEXT, impressions BIGINT, clicks BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ad_campaigns ac
    JOIN profiles p ON p.claimed_company_id = ac.company_id
    WHERE ac.id = p_campaign_id AND p.id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM ad_campaigns WHERE id = p_campaign_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(i.canton, c.canton) AS canton,
    COALESCE(i.cnt, 0)::BIGINT   AS impressions,
    COALESCE(c.cnt, 0)::BIGINT   AS clicks
  FROM (
    SELECT viewer_canton AS canton, COUNT(*) AS cnt
    FROM ad_impressions
    WHERE campaign_id = p_campaign_id AND viewer_canton IS NOT NULL
    GROUP BY 1
  ) i
  FULL OUTER JOIN (
    SELECT viewer_canton AS canton, COUNT(*) AS cnt
    FROM ad_clicks
    WHERE campaign_id = p_campaign_id AND viewer_canton IS NOT NULL
    GROUP BY 1
  ) c ON c.canton = i.canton
  ORDER BY impressions DESC;
END;
$$;
