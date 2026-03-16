-- Beer packaging fields migration
-- Run in Supabase SQL editor

-- Add package_type to inventory_items (if pack_size_migration.sql and package_type_migration.sql not yet run)
alter table inventory_items
  add column if not exists pack_size integer check (pack_size > 0);

alter table inventory_items
  add column if not exists package_type text;

-- Add packaging metadata to purchase_import_draft_lines
alter table purchase_import_draft_lines
  add column if not exists package_type text;

alter table purchase_import_draft_lines
  add column if not exists units_per_package integer check (units_per_package > 0);
