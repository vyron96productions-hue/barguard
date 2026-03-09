-- Drink Library + Profit Intelligence Migration
-- Run this in your Supabase SQL editor

-- ── 1. Cost per oz on inventory items ───────────────────────────────────────
alter table inventory_items
  add column if not exists cost_per_oz numeric(10,4);

-- ── 2. Drink library items ───────────────────────────────────────────────────
-- Display layer for bartenders. Separate from menu_items (operational engine).
create table if not exists drink_library_items (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  name           text not null,
  category       text,                  -- e.g. 'cocktail', 'shot', 'beer', 'mocktail'
  glassware      text,                  -- e.g. 'rocks', 'highball', 'martini'
  garnish        text,
  instructions   text,
  notes          text,
  menu_item_id   uuid references menu_items(id) on delete set null,  -- optional link to operational engine
  created_at     timestamptz not null default now(),
  unique (business_id, name)
);
create index if not exists idx_drink_library_business on drink_library_items(business_id);
create index if not exists idx_drink_library_menu_item on drink_library_items(menu_item_id);

-- ── 3. Drink library ingredients ────────────────────────────────────────────
-- The recipe as displayed to bartenders (human-readable quantities).
create table if not exists drink_library_ingredients (
  id                  uuid primary key default gen_random_uuid(),
  drink_library_id    uuid not null references drink_library_items(id) on delete cascade,
  inventory_item_id   uuid references inventory_items(id) on delete set null,
  ingredient_name     text not null,   -- display name (fallback if no inventory_item_id)
  quantity_oz         numeric(8,4) not null,
  notes               text,            -- e.g. 'fresh squeezed', 'muddled'
  sort_order          integer not null default 0
);
create index if not exists idx_drink_ingredients_library on drink_library_ingredients(drink_library_id);
create index if not exists idx_drink_ingredients_item on drink_library_ingredients(inventory_item_id);

-- ── 4. Drink library aliases ─────────────────────────────────────────────────
-- Alternate names / nicknames for search matching.
create table if not exists drink_library_aliases (
  id               uuid primary key default gen_random_uuid(),
  drink_library_id uuid not null references drink_library_items(id) on delete cascade,
  alias            text not null,
  unique (drink_library_id, alias)
);
create index if not exists idx_drink_aliases_library on drink_library_aliases(drink_library_id);

-- ── 5. Drink profit summaries ────────────────────────────────────────────────
-- Stored per period/shift per menu_item for profit reporting.
create table if not exists drink_profit_summaries (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references businesses(id) on delete cascade,
  menu_item_id          uuid not null references menu_items(id) on delete cascade,
  period_start          date not null,
  period_end            date not null,
  shift_label           text,
  quantity_sold         integer not null default 0,
  gross_revenue         numeric(12,2),
  estimated_cost        numeric(12,4),
  estimated_profit      numeric(12,2),
  profit_margin_pct     numeric(6,2),
  has_full_cost         boolean not null default false,
  calculated_at         timestamptz not null default now(),
  unique (business_id, menu_item_id, period_start, period_end, shift_label)
);
create index if not exists idx_profit_summaries_business on drink_profit_summaries(business_id, period_start, period_end);
create index if not exists idx_profit_summaries_menu_item on drink_profit_summaries(menu_item_id);
