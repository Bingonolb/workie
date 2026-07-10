-- Update spent_chf on each impression and auto-complete when budget exhausted
CREATE OR REPLACE FUNCTION public.increment_ad_impression(p_campaign_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cpm NUMERIC;
  v_cost NUMERIC;
BEGIN
  SELECT cpm_chf INTO v_cpm FROM public.ad_campaigns WHERE id = p_campaign_id;
  v_cost := COALESCE(v_cpm, 0) / 1000.0;

  UPDATE public.ad_campaigns
  SET
    impression_count = impression_count + 1,
    spent_chf        = spent_chf + v_cost,
    status = CASE
      WHEN spent_chf + v_cost >= total_budget_chf THEN 'completed'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

-- Index for efficient random rotation weighted by remaining budget
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active_format
  ON public.ad_campaigns(status, format)
  WHERE status = 'active';

-- Daily stats view for annonceur dashboard
CREATE OR REPLACE VIEW public.ad_campaign_daily_stats AS
SELECT
  campaign_id,
  DATE(viewed_at AT TIME ZONE 'Europe/Zurich') AS day,
  COUNT(*) AS impressions
FROM public.ad_impressions
GROUP BY campaign_id, day

UNION ALL

SELECT
  campaign_id,
  DATE(clicked_at AT TIME ZONE 'Europe/Zurich') AS day,
  0 AS impressions
FROM public.ad_clicks
WHERE false; -- placeholder so type matches; clicks joined separately

-- Separate daily clicks view
CREATE OR REPLACE VIEW public.ad_campaign_daily_clicks AS
SELECT
  campaign_id,
  DATE(clicked_at AT TIME ZONE 'Europe/Zurich') AS day,
  COUNT(*) AS clicks
FROM public.ad_clicks
GROUP BY campaign_id, day;

-- Allow business to read their own impression/click rows (for daily stats)
CREATE POLICY "business_view_own_impressions" ON public.ad_impressions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.ad_campaigns
      WHERE company_id IN (
        SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "business_view_own_clicks" ON public.ad_clicks
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.ad_campaigns
      WHERE company_id IN (
        SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );
