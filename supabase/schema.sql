-- BarGuard MVP Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────
-- businesses
-- ───────────────────────────────────────────
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- inventory_items
-- ───────────────────────────────────────────
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  unit text not null default 'oz',
  category text,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);
create index if not exists idx_inventory_items_business on inventory_items(business_id);

-- ───────────────────────────────────────────
-- menu_items
-- ───────────────────────────────────────────
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);
create index if not exists idx_menu_items_business on menu_items(business_id);

-- ───────────────────────────────────────────
-- menu_item_recipes
-- ───────────────────────────────────────────
create table if not exists menu_item_recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric not null,
  unit text not null default 'oz',
  unique (menu_item_id, inventory_item_id)
);
create index if not exists idx_recipes_menu_item on menu_item_recipes(menu_item_id);
create index if not exists idx_recipes_inventory_item on menu_item_recipes(inventory_item_id);

-- ───────────────────────────────────────────
-- sales_uploads
-- ───────────────────────────────────────────
create table if not exists sales_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  filename text not null,
  period_start date not null,
  period_end date not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_sales_uploads_business on sales_uploads(business_id, period_start, period_end);

-- ───────────────────────────────────────────
-- sales_transactions
-- ───────────────────────────────────────────
create table if not exists sales_transactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references sales_uploads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  sale_date date not null,
  raw_item_name text not null,
  menu_item_id uuid references menu_items(id),
  quantity_sold numeric not null,
  gross_sales numeric
);
create index if not exists idx_sales_tx_business_date on sales_transactions(business_id, sale_date);
create index if not exists idx_sales_tx_menu_item on sales_transactions(menu_item_id);

-- ───────────────────────────────────────────
-- inventory_count_uploads
-- ───────────────────────────────────────────
create table if not exists inventory_count_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  filename text not null,
  count_date date not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_inv_count_uploads_business on inventory_count_uploads(business_id, count_date);

-- ───────────────────────────────────────────
-- inventory_counts
-- ───────────────────────────────────────────
create table if not exists inventory_counts (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references inventory_count_uploads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  count_date date not null,
  raw_item_name text not null,
  inventory_item_id uuid references inventory_items(id),
  quantity_on_hand numeric not null,
  unit_type text
);
create index if not exists idx_inv_counts_business_date on inventory_counts(business_id, count_date);
create index if not exists idx_inv_counts_item on inventory_counts(inventory_item_id);

-- ───────────────────────────────────────────
-- purchase_uploads
-- ───────────────────────────────────────────
create table if not exists purchase_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  filename text not null,
  period_start date not null,
  period_end date not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_purchase_uploads_business on purchase_uploads(business_id, period_start, period_end);

-- ───────────────────────────────────────────
-- purchases
-- ───────────────────────────────────────────
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references purchase_uploads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  purchase_date date not null,
  raw_item_name text not null,
  inventory_item_id uuid references inventory_items(id),
  quantity_purchased numeric not null,
  vendor_name text,
  unit_cost numeric,
  unit_type text
);
create index if not exists idx_purchases_business_date on purchases(business_id, purchase_date);
create index if not exists idx_purchases_item on purchases(inventory_item_id);

-- ───────────────────────────────────────────
-- inventory_usage_summaries
-- ───────────────────────────────────────────
create table if not exists inventory_usage_summaries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  beginning_inventory numeric not null default 0,
  ending_inventory numeric not null default 0,
  purchased numeric not null default 0,
  actual_usage numeric not null default 0,
  expected_usage numeric not null default 0,
  variance numeric not null default 0,
  variance_percent numeric,
  status text not null default 'normal',
  calculated_at timestamptz not null default now(),
  unique (business_id, inventory_item_id, period_start, period_end)
);
create index if not exists idx_usage_summaries_business on inventory_usage_summaries(business_id, period_start, period_end);

-- ───────────────────────────────────────────
-- ai_summaries
-- ───────────────────────────────────────────
create table if not exists ai_summaries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_summaries_business on ai_summaries(business_id, period_start, period_end);

-- ───────────────────────────────────────────
-- inventory_item_aliases
-- ───────────────────────────────────────────
create table if not exists inventory_item_aliases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  raw_name text not null,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  unique (business_id, raw_name)
);
create index if not exists idx_inv_aliases_business on inventory_item_aliases(business_id);

-- ───────────────────────────────────────────
-- menu_item_aliases
-- ───────────────────────────────────────────
create table if not exists menu_item_aliases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  raw_name text not null,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  unique (business_id, raw_name)
);
create index if not exists idx_menu_aliases_business on menu_item_aliases(business_id);
