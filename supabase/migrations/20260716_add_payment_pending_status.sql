-- Add payment_pending to ad_campaigns status check constraint
-- The app inserts status='payment_pending' when a campaign is created before payment confirmation.
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN ('payment_pending','pending','active','paused','completed','rejected'));
