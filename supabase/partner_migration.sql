-- ============================================================
-- BarGuard — Partner Management Migration
-- ============================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).
-- Safe to run on existing database — uses IF NOT EXISTS / IF NOT EXISTS guards.
-- ============================================================


-- ── partners ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  contact_name        text        NOT NULL,
  email               text        NOT NULL,
  phone               text,
  partner_code        text        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',   -- pending | active | suspended
  pricing_type        text        NOT NULL DEFAULT 'rev_share', -- rev_share | wholesale | custom
  revenue_share_pct   numeric,                                  -- e.g. 20 = 20%
  wholesale_price     numeric,                                  -- $ per merchant per month
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Unique constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_email_unique'
  ) THEN
    ALTER TABLE partners ADD CONSTRAINT partners_email_unique UNIQUE (email);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_partner_code_unique'
  ) THEN
    ALTER TABLE partners ADD CONSTRAINT partners_partner_code_unique UNIQUE (partner_code);
  END IF;
END $$;

-- ── partner_users ────────────────────────────────────────────
-- Links a Supabase auth.users row to a partner record.
-- One auth user per partner (one-to-one for MVP).
CREATE TABLE IF NOT EXISTS partner_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL,  -- FK to auth.users (not enforced at DB level to avoid cross-schema issues)
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_users_partner ON partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_user    ON partner_users(user_id);


-- ── businesses: add partner columns ─────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS partner_id   uuid REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'direct'; -- direct | partner_managed

CREATE INDEX IF NOT EXISTS idx_businesses_partner ON businesses(partner_id) WHERE partner_id IS NOT NULL;


-- ── user_businesses: add is_admin (if not already present) ──
-- Required by the existing admin auth system (lib/admin-auth.ts)
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;


-- ── businesses: backfill missing billing columns ─────────────
-- These are used in code but may be missing from older schema installs.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan                    text        DEFAULT 'legacy';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at           timestamptz;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id  text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id      text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email_verified          boolean     DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone                   text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bar_type                text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS disabled                boolean     DEFAULT false;


-- ── Fix existing pack_size gaps (run if not already done) ────
UPDATE inventory_items SET pack_size = 24,  package_type = 'case'        WHERE unit = 'case'       AND pack_size IS NULL;
UPDATE inventory_items SET pack_size = 165, package_type = 'keg'         WHERE unit = 'keg'        AND pack_size IS NULL;
UPDATE inventory_items SET pack_size = 82,  package_type = 'half keg'    WHERE unit = 'halfkeg'    AND pack_size IS NULL;
UPDATE inventory_items SET pack_size = 62,  package_type = 'quarter keg' WHERE unit = 'quarterkeg' AND pack_size IS NULL;
UPDATE inventory_items SET pack_size = 41,  package_type = 'sixth keg'   WHERE unit = 'sixthkeg'   AND pack_size IS NULL;
