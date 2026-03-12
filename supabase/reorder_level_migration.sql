-- Add reorder_level column to inventory_items
-- Run this in your Supabase SQL editor

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS reorder_level numeric;
