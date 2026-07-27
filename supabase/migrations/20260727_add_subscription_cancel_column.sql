-- Tracks whether the subscription is scheduled to cancel at the end of the current period.
-- Set by Stripe webhook on customer.subscription.updated events.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
