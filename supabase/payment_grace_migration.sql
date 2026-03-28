-- ── Payment Grace Period ─────────────────────────────────────────────────────
-- Run this migration before deploying payment_grace_ends_at logic.
-- Adds the column that tracks a 3-day window after a failed Stripe payment.
-- During this window the user retains app access. After it, middleware locks them out.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS payment_grace_ends_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN businesses.payment_grace_ends_at IS
  'Set to now() + 3 days on invoice.payment_failed. Cleared on invoice.payment_succeeded.
   Null means no payment issue. Non-null and in the past means the user is locked out.';
