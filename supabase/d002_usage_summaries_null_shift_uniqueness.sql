-- D-002: Fix NULL shift_label uniqueness in inventory_usage_summaries
--
-- Problem: The existing UNIQUE constraint on (business_id, inventory_item_id,
-- period_start, period_end) does not include shift_label. If we expand the
-- constraint to include shift_label (so shift-mode and date-range rows can
-- coexist for the same period), NULL values would bypass uniqueness — SQL
-- treats NULL != NULL, so multiple rows with shift_label = NULL for the same
-- item/period would never conflict.
--
-- Fix: Replace the existing constraint with a functional unique index using
-- COALESCE(shift_label, ''). This maps NULL to an empty string for uniqueness
-- purposes, so NULL rows DO conflict with each other. Empty string is safe
-- here because shift_label is always a user-readable label (e.g. "Morning
-- Shift") and will never be an empty string in practice.
--
-- Why functional index over partial indexes:
--   - Single index is easier to reason about
--   - If onConflict is ever added in app code, a single index expression is
--     cleaner to reference than two partial index conditions
--   - COALESCE is a standard Postgres pattern for nullable unique columns
--
-- Idempotent: safe to re-run. DROP CONSTRAINT IF EXISTS and CREATE UNIQUE
-- INDEX IF NOT EXISTS both handle the already-applied case.
--
-- Run once in the Supabase SQL editor.

-- ── Step 1: Inspect duplicates (optional — run first to preview) ─────────────
-- SELECT
--   business_id,
--   inventory_item_id,
--   period_start,
--   period_end,
--   COALESCE(shift_label, '') AS effective_shift_label,
--   COUNT(*) AS duplicate_count
-- FROM inventory_usage_summaries
-- GROUP BY 1, 2, 3, 4, 5
-- HAVING COUNT(*) > 1
-- ORDER BY duplicate_count DESC;

-- ── Step 2: Remove duplicates ─────────────────────────────────────────────────
-- Keep the row with the latest calculated_at per logical group.
-- If calculated_at ties, keep the row with the lexicographically smallest id
-- (arbitrary but deterministic — avoids random ordering).
DELETE FROM inventory_usage_summaries
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY business_id, inventory_item_id, period_start, period_end,
                     COALESCE(shift_label, '')
        ORDER BY calculated_at DESC, id
      ) AS rn
    FROM inventory_usage_summaries
  ) ranked
  WHERE rn > 1
);

-- ── Step 3: Drop the existing constraint ─────────────────────────────────────
-- The auto-generated name from UNIQUE (...) in CREATE TABLE.
ALTER TABLE inventory_usage_summaries
  DROP CONSTRAINT IF EXISTS
  inventory_usage_summaries_business_id_inventory_item_id_period_start_period_end_key;

-- ── Step 4: Add functional unique index ──────────────────────────────────────
-- Enforces:
--   • At most one date-range row (shift_label IS NULL) per (business, item, period)
--   • At most one shift row per (business, item, period, shift_label) value
--   • Date-range and shift rows with the same period coexist without conflicting
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_summaries_unique_period_shift
  ON inventory_usage_summaries (
    business_id,
    inventory_item_id,
    period_start,
    period_end,
    COALESCE(shift_label, '')
  );
