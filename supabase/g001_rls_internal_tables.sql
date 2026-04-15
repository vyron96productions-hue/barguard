-- Enable RLS on internal server-side tables that were missing it.
-- No user-facing policies are added — service role bypasses RLS and is the
-- only caller of these tables. Enabling RLS with no policies means anon/user
-- tokens get zero rows, which is the correct behaviour.

ALTER TABLE webhook_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_poll_log           ENABLE ROW LEVEL SECURITY;
