-- Add pack_size to inventory_items
-- pack_size = number of individual units per pack (e.g. 24 for a 24-pack of beer)
-- NULL means no pack tracking for this item

alter table inventory_items
  add column if not exists pack_size integer check (pack_size > 0);
