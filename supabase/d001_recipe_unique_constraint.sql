-- D-001: Add UNIQUE constraint on menu_item_recipes(menu_item_id, inventory_item_id)
--
-- Background: schema.sql already defines this constraint in CREATE TABLE IF NOT EXISTS,
-- but databases created before that line was added do not have it. This migration
-- (1) detects and removes duplicate rows, then (2) adds the constraint idempotently.
--
-- Run this once in the Supabase SQL editor. It is safe to re-run.

-- ── Step 1: Inspect duplicates ────────────────────────────────────────────────
-- (optional read — run this first to see what will be deleted)
--
-- SELECT menu_item_id, inventory_item_id, COUNT(*) AS n
-- FROM menu_item_recipes
-- GROUP BY menu_item_id, inventory_item_id
-- HAVING COUNT(*) > 1
-- ORDER BY n DESC;

-- ── Step 2: Remove duplicate rows ────────────────────────────────────────────
-- Keep the row with the smallest id per (menu_item_id, inventory_item_id) pair.
-- All other rows for the same pair are deleted.
DELETE FROM menu_item_recipes
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY menu_item_id, inventory_item_id
        ORDER BY id  -- keep the first-created row (lowest UUID lexicographically)
      ) AS rn
    FROM menu_item_recipes
  ) ranked
  WHERE rn > 1
);

-- ── Step 3: Add UNIQUE constraint idempotently ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'menu_item_recipes'::regclass
      AND contype = 'u'
      AND conname = 'menu_item_recipes_menu_item_id_inventory_item_id_key'
  ) THEN
    ALTER TABLE menu_item_recipes
      ADD CONSTRAINT menu_item_recipes_menu_item_id_inventory_item_id_key
      UNIQUE (menu_item_id, inventory_item_id);
    RAISE NOTICE 'Constraint added.';
  ELSE
    RAISE NOTICE 'Constraint already exists — no action taken.';
  END IF;
END
$$;
