-- j001_team_names_activity_log.sql
-- Adds display_name + email to user_businesses/invites, and a team_activity_log table.

-- ── user_businesses: name + email columns ─────────────────────────────────
ALTER TABLE user_businesses
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS email        text;

-- ── business_user_invites: carry the display_name through to membership ───
ALTER TABLE business_user_invites
  ADD COLUMN IF NOT EXISTS display_name text;

-- ── team_activity_log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_activity_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Snapshot of the actor's display name at the time of the action.
  -- Preserved even if the member is later renamed or removed.
  display_name text,
  -- Short action key, e.g. 'inventory_count', 'role_changed', 'member_invited', 'member_removed'
  action       text        NOT NULL,
  -- Arbitrary JSON payload for action-specific context
  details      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tal_business_created
  ON team_activity_log(business_id, created_at DESC);

-- RLS
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin/owner can read their business's log
DROP POLICY IF EXISTS "tal_select" ON team_activity_log;
CREATE POLICY "tal_select" ON team_activity_log
  FOR SELECT USING (
    business_id = current_business_id()
    AND has_minimum_client_role('admin')
  );

-- Inserts use service-role client (adminSupabase) — no user-facing INSERT policy needed.
