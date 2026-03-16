-- Add package_type to inventory_items
-- package_type: human-readable package label, e.g. 'single', '6-pack', '12-pack', '24-pack', 'case', 'keg'
-- Works alongside pack_size (units per package) added in pack_size_migration.sql

alter table inventory_items
  add column if not exists package_type text;
