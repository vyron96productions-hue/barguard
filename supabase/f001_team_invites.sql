-- f001_team_invites.sql
-- Adds multi-user membership (team invite) support to BarGuard.
-- Safe to rerun — all changes use IF NOT EXISTS / CREATE OR REPLACE.
--
-- Run order:
--   1. Add/backfill user_businesses columns
--   2. Create business_user_invites table
--   3. Create/replace SQL helper functions (including current_business_id fix)
--   4. Update RLS policies
--
-- IMPORTANT: Run this migration BEFORE deploying the matching app code.
-- Rolling back: see rollback notes at the bottom of this file.

-- ============================================================
-- STEP 1: Add new columns to user_businesses
-- ============================================================

-- client_role: the customer-facing permission tier for this membership.
-- Owners always get effective 'admin' regardless of this value.
ALTER TABLE user_businesses
  ADD COLUMN IF NOT EXISTS client_role text NOT NULL DEFAULT 'admin';

ALTER TABLE user_businesses
  DROP CONSTRAINT IF EXISTS ub_client_role_check;
ALTER TABLE user_businesses
  ADD CONSTRAINT ub_client_role_check
  CHECK (client_role IN ('admin', 'manager', 'employee'));

-- membership_status: 'active' = current member, 'removed' = soft-deleted.
-- Soft delete preserves audit history without granting access.
ALTER TABLE user_businesses
  ADD COLUMN IF NOT EXISTS membership_status text NOT NULL DEFAULT 'active';

ALTER TABLE user_businesses
  DROP CONSTRAINT IF EXISTS ub_membership_status_check;
ALTER TABLE user_businesses
  ADD CONSTRAINT ub_membership_status_check
  CHECK (membership_status IN ('active', 'removed'));

-- invited_by_user_id: NULL for original owners, set for invited members.
ALTER TABLE user_businesses
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- joined_at: when they first accepted / were first inserted.
ALTER TABLE user_businesses
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();

-- ── Backfill existing rows ────────────────────────────────────────────────
-- All existing rows are owners; set them to active admin status.
-- Non-owner rows do not exist yet so the UPDATE is a no-op in production.
UPDATE user_businesses
SET
  client_role       = 'admin',
  membership_status = 'active'
WHERE
  -- Only touch rows that need updating (idempotent)
  client_role != 'admin' OR membership_status != 'active';

-- ── Indexes for common access patterns ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ub_user_id
  ON user_businesses(user_id);

CREATE INDEX IF NOT EXISTS idx_ub_business_active
  ON user_businesses(business_id, membership_status, client_role);

-- ============================================================
-- STEP 2: Create business_user_invites table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_user_invites (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- The email the invite was sent to (display)
  email               text        NOT NULL,
  -- Lowercase-trimmed email used for uniqueness and matching
  normalized_email    text        NOT NULL,
  -- Role that will be assigned on acceptance
  client_role         text        NOT NULL CHECK (client_role IN ('admin', 'manager', 'employee')),
  -- SHA-256 hex of the raw random token sent in the invite link
  token_hash          text        NOT NULL UNIQUE,
  -- Who sent this invite (must be an admin/owner of the business)
  invited_by_user_id  uuid        NOT NULL REFERENCES auth.users(id),
  -- Set once the invitee accepts (their user_id after account creation/login)
  invitee_user_id     uuid        REFERENCES auth.users(id),
  -- Link expires at this time — typically 7 days from creation
  expires_at          timestamptz NOT NULL,
  -- Timestamps for lifecycle tracking
  accepted_at         timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bui_business_email
  ON business_user_invites(business_id, normalized_email);

CREATE INDEX IF NOT EXISTS idx_bui_token_hash
  ON business_user_invites(token_hash);

-- Only one open (not yet accepted or revoked) invite per business+email.
-- This prevents double-inviting the same person without revoking the first.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bui_open_invite
  ON business_user_invites(business_id, normalized_email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- ============================================================
-- STEP 3: Create / replace SQL helper functions
-- ============================================================

-- current_business_id(): returns the business for the current authenticated user.
-- FIX: now filters by membership_status = 'active' so removed members get NULL.
-- All existing RLS tenant_all policies call this function, so this single fix
-- propagates to every downstream policy atomically.
CREATE OR REPLACE FUNCTION current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT business_id
  FROM   user_businesses
  WHERE  user_id           = auth.uid()
    AND  membership_status = 'active'
  LIMIT  1
$$;

-- current_client_role(): returns the effective permission tier.
-- Owners always resolve to 'admin' regardless of their stored client_role.
CREATE OR REPLACE FUNCTION current_client_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN role = 'owner' THEN 'admin'
    ELSE client_role
  END
  FROM user_businesses
  WHERE user_id           = auth.uid()
    AND membership_status = 'active'
  LIMIT 1
$$;

-- is_business_owner(): true if the current user is the owner of their active business.
CREATE OR REPLACE FUNCTION is_business_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_id           = auth.uid()
      AND membership_status = 'active'
      AND role              = 'owner'
  )
$$;

-- has_minimum_client_role(required): true if effective role >= required.
-- Role order: employee(1) < manager(2) < admin(3)
CREATE OR REPLACE FUNCTION has_minimum_client_role(required text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE current_client_role()
    WHEN 'admin'    THEN true
    WHEN 'manager'  THEN required IN ('manager', 'employee')
    WHEN 'employee' THEN required = 'employee'
    ELSE false
  END
$$;

-- ============================================================
-- STEP 4: Update RLS policies
-- ============================================================

-- ── user_businesses ───────────────────────────────────────────────────────

-- Self-select + admin/owner can see all active members of their business
DROP POLICY IF EXISTS "ub_select" ON user_businesses;
CREATE POLICY "ub_select" ON user_businesses
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      business_id      = current_business_id()
      AND membership_status = 'active'
      AND has_minimum_client_role('admin')
    )
  );

-- Inserts via user session (for the original signup flow).
-- Invite acceptance inserts use the service-role client (bypasses RLS).
DROP POLICY IF EXISTS "ub_insert" ON user_businesses;
CREATE POLICY "ub_insert" ON user_businesses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin/owner can update (role change / soft-delete) non-owner active members.
-- Owner rows (role = 'owner') are protected from update via RLS.
DROP POLICY IF EXISTS "ub_update" ON user_businesses;
CREATE POLICY "ub_update" ON user_businesses
  FOR UPDATE USING (
    business_id      = current_business_id()
    AND role        != 'owner'
    AND membership_status = 'active'
    AND has_minimum_client_role('admin')
  );

-- ── business_user_invites ─────────────────────────────────────────────────

ALTER TABLE business_user_invites ENABLE ROW LEVEL SECURITY;

-- Admin/owner can read their business's invites
DROP POLICY IF EXISTS "bui_select" ON business_user_invites;
CREATE POLICY "bui_select" ON business_user_invites
  FOR SELECT USING (
    business_id = current_business_id()
    AND has_minimum_client_role('admin')
  );

-- Admin/owner can create invites for their business
DROP POLICY IF EXISTS "bui_insert" ON business_user_invites;
CREATE POLICY "bui_insert" ON business_user_invites
  FOR INSERT WITH CHECK (
    business_id = current_business_id()
    AND has_minimum_client_role('admin')
  );

-- Admin/owner can revoke invites (update revoked_at)
DROP POLICY IF EXISTS "bui_update" ON business_user_invites;
CREATE POLICY "bui_update" ON business_user_invites
  FOR UPDATE USING (
    business_id = current_business_id()
    AND has_minimum_client_role('admin')
  );

-- ── businesses ────────────────────────────────────────────────────────────

-- Only admin/owner can update business settings (was unrestricted before)
DROP POLICY IF EXISTS "biz_update" ON businesses;
CREATE POLICY "biz_update" ON businesses
  FOR UPDATE USING (
    id = current_business_id()
    AND has_minimum_client_role('admin')
  );

-- ============================================================
-- ROLLBACK NOTES (soft rollback — preserves invite data)
-- ============================================================
-- To roll back without data loss:
--   1. Revert app deployment first.
--   2. Restore original current_business_id() (remove membership_status filter).
--   3. Drop new policies (bui_*, ub_update) and restore originals.
--   4. Do NOT drop the new columns or business_user_invites table.
--      Dropped columns = lost invite records. Keep them, just disable the UI.
--
-- To hard rollback (destroys invite data):
--   DROP TABLE business_user_invites;
--   DROP FUNCTION current_client_role, is_business_owner, has_minimum_client_role;
--   ALTER TABLE user_businesses DROP COLUMN client_role, membership_status,
--     invited_by_user_id, joined_at;
--   Restore schema.sql version of current_business_id().
