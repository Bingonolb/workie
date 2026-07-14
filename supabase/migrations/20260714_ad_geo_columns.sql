-- Add geo-targeting columns to ad tracking tables
-- These columns are inserted by trackAdImpression / trackAdClick (ads.ts)
-- and queried by getCampaignCantonStats for the annonceur dashboard.
-- Without these, geo inserts fail silently and canton stats always return empty.

ALTER TABLE public.ad_impressions
  ADD COLUMN IF NOT EXISTS viewer_canton TEXT,
  ADD COLUMN IF NOT EXISTS viewer_city   TEXT;

ALTER TABLE public.ad_clicks
  ADD COLUMN IF NOT EXISTS viewer_canton TEXT;

-- Partial indexes for fast canton aggregations (only non-null rows)
CREATE INDEX IF NOT EXISTS idx_ad_impressions_canton
  ON public.ad_impressions(viewer_canton)
  WHERE viewer_canton IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ad_clicks_canton
  ON public.ad_clicks(viewer_canton)
  WHERE viewer_canton IS NOT NULL;
