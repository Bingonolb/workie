-- Add Stripe payment tracking columns to ad_campaigns
-- The webhook (route.ts) tries to set these on payment confirmation,
-- but they were missing so the entire update was silently failing —
-- campaigns stayed in 'payment_pending' forever after a successful payment.
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_stripe_session
  ON public.ad_campaigns(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
