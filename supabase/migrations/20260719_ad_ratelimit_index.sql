-- Partial unique index: 1 impression per (user_id, campaign_id) per hour for logged-in users.
-- This prevents budget exhaustion attacks that bypass the in-process rate limiter
-- (which resets on cold starts in serverless environments).
-- Anonymous traffic (user_id IS NULL) is still rate-limited in-process only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_impressions_user_campaign_hour
  ON public.ad_impressions (
    user_id,
    campaign_id,
    DATE_TRUNC('hour', viewed_at AT TIME ZONE 'UTC')
  )
  WHERE user_id IS NOT NULL;
