-- k001_modifier_rules_swap_columns.sql
-- Adds the swap-mode columns to modifier_rules.
-- The modifier rules page swap action (specific-item and category-based modes)
-- requires these columns to store which ingredient to remove and which to add.
-- Run once in Supabase SQL Editor.

ALTER TABLE modifier_rules
  ADD COLUMN IF NOT EXISTS swap_remove_item_id   uuid    REFERENCES inventory_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS swap_remove_category  text,
  ADD COLUMN IF NOT EXISTS swap_remove_qty       numeric,
  ADD COLUMN IF NOT EXISTS swap_remove_unit      text,
  ADD COLUMN IF NOT EXISTS swap_add_item_id      uuid    REFERENCES inventory_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS swap_add_qty          numeric,
  ADD COLUMN IF NOT EXISTS swap_add_unit         text;
