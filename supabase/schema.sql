-- ============================================================
-- BarGuard — Authoritative Database Schema
-- ============================================================
-- This is the single source of truth for the BarGuard database.
-- It consolidates the original schema.sql plus all migrations:
--   multi_tenant_migration.sql
--   beer_packaging_migration.sql
--   pack_size_migration.sql
--   package_type_migration.sql
--   drink_profit_migration.sql
--   purchase_scan_migration.sql
--   reorder_level_migration.sql
--   shift_analytics_migration.sql
--   pos_schema.sql
--   vendors_migration.sql
--
-- Safe to run on a fresh database (CREATE TABLE IF NOT EXISTS)
-- or on an existing database (ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
-- Do NOT include seed data here — use seed.sql for that.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- SECTION 1: Core tenancy
-- ============================================================

-- ── businesses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  address       text,
  contact_email text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── user_businesses ─────────────────────────────────────────
-- Maps auth.users → businesses (many-to-many, typically one each for now)
CREATE TABLE IF NOT EXISTS user_businesses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'owner',
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- ── vendors ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  email       text        NOT NULL,
  rep_name    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_vendors_business ON vendors(business_id);


-- ============================================================
-- SECTION 2: Inventory
-- ============================================================

-- ── inventory_items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  unit          text        NOT NULL DEFAULT 'oz',  -- oz, ml, bottle, case, keg, each, lb, portion, etc.
  category      text,
  item_type     text        NOT NULL DEFAULT 'beverage',  -- 'beverage' | 'food' | 'other'
  pack_size     integer     CHECK (pack_size > 0),        -- units per package (e.g. 24 for a 24-pack)
  package_type  text,                                      -- human label: 'single', '6-pack', 'case', 'keg', etc.
  cost_per_oz   numeric(10,4),                             -- cost in USD per oz (beverages)
  cost_per_unit numeric(10,4),                             -- cost in USD per unit (bottle/keg/each/lb/etc.)
  reorder_level numeric,                                   -- alert when stock on hand ≤ this value
  vendor_id     uuid        REFERENCES vendors(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON inventory_items(business_id);

-- Idempotent column additions for existing databases
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_type     text        NOT NULL DEFAULT 'beverage';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS pack_size     integer     CHECK (pack_size > 0);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS package_type  text;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_per_oz   numeric(10,4);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_per_unit numeric(10,4);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS reorder_level numeric;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS vendor_id     uuid        REFERENCES vendors(id) ON DELETE SET NULL;

-- ── inventory_item_aliases ───────────────────────────────────
-- Maps raw invoice / CSV names to canonical inventory items
CREATE TABLE IF NOT EXISTS inventory_item_aliases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  raw_name          text NOT NULL,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  UNIQUE (business_id, raw_name)
);
CREATE INDEX IF NOT EXISTS idx_inv_aliases_business ON inventory_item_aliases(business_id);

-- ── inventory_count_uploads ──────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_count_uploads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename    text        NOT NULL,
  count_date  date        NOT NULL,
  row_count   integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_count_uploads_business ON inventory_count_uploads(business_id, count_date);

-- ── inventory_counts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_counts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id         uuid        NOT NULL REFERENCES inventory_count_uploads(id) ON DELETE CASCADE,
  business_id       uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  count_date        date        NOT NULL,
  raw_item_name     text        NOT NULL,
  inventory_item_id uuid        REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity_on_hand  numeric     NOT NULL,
  unit_type         text,
  count_timestamp   timestamptz  -- precise timestamp for shift-end counts (shift_analytics_migration)
);
CREATE INDEX IF NOT EXISTS idx_inv_counts_business_date ON inventory_counts(business_id, count_date);
CREATE INDEX IF NOT EXISTS idx_inv_counts_item          ON inventory_counts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_counts_ts            ON inventory_counts(business_id, count_timestamp)
  WHERE count_timestamp IS NOT NULL;

-- Idempotent column additions for existing databases
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS count_timestamp timestamptz;

-- ── inventory_usage_summaries ────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_usage_summaries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  inventory_item_id uuid        NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  period_start      date        NOT NULL,
  period_end        date        NOT NULL,
  beginning_inventory numeric   NOT NULL DEFAULT 0,
  ending_inventory    numeric   NOT NULL DEFAULT 0,
  purchased           numeric   NOT NULL DEFAULT 0,
  actual_usage        numeric   NOT NULL DEFAULT 0,
  expected_usage      numeric   NOT NULL DEFAULT 0,
  variance            numeric   NOT NULL DEFAULT 0,
  variance_percent    numeric,
  status              text      NOT NULL DEFAULT 'normal',  -- 'normal' | 'warning' | 'critical'
  -- shift tracking (shift_analytics_migration)
  shift_start         timestamptz,
  shift_end           timestamptz,
  shift_label         text,
  total_revenue       numeric,
  total_covers        integer,
  calculated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, inventory_item_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_usage_summaries_business ON inventory_usage_summaries(business_id, period_start, period_end);

-- Idempotent column additions for existing databases
ALTER TABLE inventory_usage_summaries ADD COLUMN IF NOT EXISTS shift_start   timestamptz;
ALTER TABLE inventory_usage_summaries ADD COLUMN IF NOT EXISTS shift_end     timestamptz;
ALTER TABLE inventory_usage_summaries ADD COLUMN IF NOT EXISTS shift_label   text;
ALTER TABLE inventory_usage_summaries ADD COLUMN IF NOT EXISTS total_revenue numeric;
ALTER TABLE inventory_usage_summaries ADD COLUMN IF NOT EXISTS total_covers  integer;


-- ============================================================
-- SECTION 3: Menu / drink library
-- ============================================================

-- ── menu_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  category    text,
  subcategory text,
  item_type   text        NOT NULL DEFAULT 'drink',   -- 'drink' | 'food' | 'beer' | 'other'
  sell_price  numeric(10,2),                           -- price charged per item
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id);

-- Idempotent column additions for existing databases
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_type   text NOT NULL DEFAULT 'drink';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sell_price  numeric(10,2);

-- ── menu_item_recipes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_item_recipes (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id      uuid    NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id uuid    NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity          numeric NOT NULL,
  unit              text    NOT NULL DEFAULT 'oz',
  UNIQUE (menu_item_id, inventory_item_id)
);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item       ON menu_item_recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_inventory_item  ON menu_item_recipes(inventory_item_id);

-- ── menu_item_aliases ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_item_aliases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  raw_name    text NOT NULL,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE (business_id, raw_name)
);
CREATE INDEX IF NOT EXISTS idx_menu_aliases_business ON menu_item_aliases(business_id);

-- ── drink_library_items ──────────────────────────────────────
-- Display layer for bartenders — separate from menu_items (operational engine)
CREATE TABLE IF NOT EXISTS drink_library_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  category     text,                            -- 'cocktail', 'shot', 'beer', 'mocktail', etc.
  glassware    text,                            -- 'rocks', 'highball', 'martini', etc.
  garnish      text,
  instructions text,
  notes        text,
  menu_item_id uuid        REFERENCES menu_items(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_drink_library_business  ON drink_library_items(business_id);
CREATE INDEX IF NOT EXISTS idx_drink_library_menu_item ON drink_library_items(menu_item_id);

-- ── drink_library_ingredients ────────────────────────────────
CREATE TABLE IF NOT EXISTS drink_library_ingredients (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drink_library_id  uuid        NOT NULL REFERENCES drink_library_items(id) ON DELETE CASCADE,
  inventory_item_id uuid        REFERENCES inventory_items(id) ON DELETE SET NULL,
  ingredient_name   text        NOT NULL,   -- display name (fallback when no inventory_item_id)
  quantity_oz       numeric(8,4) NOT NULL,
  notes             text,                   -- e.g. 'fresh squeezed', 'muddled'
  sort_order        integer     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_drink_ingredients_library ON drink_library_ingredients(drink_library_id);
CREATE INDEX IF NOT EXISTS idx_drink_ingredients_item    ON drink_library_ingredients(inventory_item_id);

-- ── drink_library_aliases ────────────────────────────────────
CREATE TABLE IF NOT EXISTS drink_library_aliases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drink_library_id uuid NOT NULL REFERENCES drink_library_items(id) ON DELETE CASCADE,
  alias            text NOT NULL,
  UNIQUE (drink_library_id, alias)
);
CREATE INDEX IF NOT EXISTS idx_drink_aliases_library ON drink_library_aliases(drink_library_id);

-- ── drink_profit_summaries ───────────────────────────────────
CREATE TABLE IF NOT EXISTS drink_profit_summaries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  menu_item_id      uuid        NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  period_start      date        NOT NULL,
  period_end        date        NOT NULL,
  shift_label       text,
  quantity_sold     integer     NOT NULL DEFAULT 0,
  gross_revenue     numeric(12,2),
  estimated_cost    numeric(12,4),
  estimated_profit  numeric(12,2),
  profit_margin_pct numeric(6,2),
  has_full_cost     boolean     NOT NULL DEFAULT false,
  calculated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, menu_item_id, period_start, period_end, shift_label)
);
CREATE INDEX IF NOT EXISTS idx_profit_summaries_business   ON drink_profit_summaries(business_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_profit_summaries_menu_item  ON drink_profit_summaries(menu_item_id);


-- ============================================================
-- SECTION 4: Sales
-- ============================================================

-- ── sales_uploads ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_uploads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename     text        NOT NULL,
  period_start date        NOT NULL,
  period_end   date        NOT NULL,
  row_count    integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_uploads_business ON sales_uploads(business_id, period_start, period_end);

-- ── sales_transactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_transactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id      uuid        NOT NULL REFERENCES sales_uploads(id) ON DELETE CASCADE,
  business_id    uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sale_date      date        NOT NULL,
  raw_item_name  text        NOT NULL,
  menu_item_id   uuid        REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity_sold  numeric     NOT NULL,
  gross_sales    numeric,
  -- shift analytics columns (shift_analytics_migration)
  sale_timestamp timestamptz,                           -- precise POS or time-stamped CSV timestamp
  guest_count    integer     CHECK (guest_count >= 0),  -- covers per transaction from POS
  check_id       text                                   -- POS check / order reference for deduplication
);
CREATE INDEX IF NOT EXISTS idx_sales_tx_business_date ON sales_transactions(business_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_tx_menu_item     ON sales_transactions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_sales_tx_business_ts   ON sales_transactions(business_id, sale_timestamp)
  WHERE sale_timestamp IS NOT NULL;

-- Idempotent column additions for existing databases
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS sale_timestamp timestamptz;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS guest_count    integer CHECK (guest_count >= 0);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS check_id       text;


-- ============================================================
-- SECTION 5: Purchases
-- ============================================================

-- ── purchase_uploads ─────────────────────────────────────────
-- Note: document_upload_id FK is added after document_uploads is created (see below)
CREATE TABLE IF NOT EXISTS purchase_uploads (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename           text        NOT NULL,
  period_start       date        NOT NULL,
  period_end         date        NOT NULL,
  row_count          integer     NOT NULL DEFAULT 0,
  document_upload_id uuid,                                                             -- scan import traceability; FK added below
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_purchase_uploads_business ON purchase_uploads(business_id, period_start, period_end);

-- ── purchases ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id         uuid        NOT NULL REFERENCES purchase_uploads(id) ON DELETE CASCADE,
  business_id       uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  purchase_date     date        NOT NULL,
  raw_item_name     text        NOT NULL,
  inventory_item_id uuid        REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity_purchased numeric    NOT NULL,
  vendor_name       text,
  unit_cost         numeric,
  unit_type         text
);
CREATE INDEX IF NOT EXISTS idx_purchases_business_date ON purchases(business_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_item          ON purchases(inventory_item_id);

-- ── document_uploads ─────────────────────────────────────────
-- Uploaded receipt / invoice files for the scan-import flow
CREATE TABLE IF NOT EXISTS document_uploads (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename           text        NOT NULL,
  file_type          text        NOT NULL,  -- 'image/jpeg', 'image/png', 'application/pdf'
  file_data          text,                  -- base64-encoded content for in-browser preview
  raw_extracted_text text,                  -- raw text returned by OCR / AI extraction
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_uploads_business ON document_uploads(business_id);

-- Back-fill forward reference: purchase_uploads.document_upload_id
-- (document_uploads must exist before this constraint can be declared)
ALTER TABLE purchase_uploads ADD COLUMN IF NOT EXISTS document_upload_id uuid
  REFERENCES document_uploads(id) ON DELETE SET NULL;

-- ── purchase_import_drafts ───────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_import_drafts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_upload_id uuid        REFERENCES document_uploads(id) ON DELETE SET NULL,
  vendor_name        text,
  purchase_date      date,
  status             text        NOT NULL DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'cancelled'
  confidence         text        NOT NULL DEFAULT 'high',      -- 'high' | 'medium' | 'low'
  warning_message    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  confirmed_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_purchase_import_drafts_business ON purchase_import_drafts(business_id);

-- ── purchase_import_draft_lines ──────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_import_draft_lines (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id          uuid    NOT NULL REFERENCES purchase_import_drafts(id) ON DELETE CASCADE,
  raw_item_name     text    NOT NULL,
  inventory_item_id uuid    REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity          numeric,
  unit_type         text,
  unit_cost         numeric,
  line_total        numeric,
  match_status      text    NOT NULL DEFAULT 'unmatched',  -- 'matched' | 'unmatched' | 'manual'
  confidence        text    NOT NULL DEFAULT 'high',       -- 'high' | 'medium' | 'low'
  is_approved       boolean NOT NULL DEFAULT true,
  package_type      text,                                  -- e.g. '6-pack', 'case'
  units_per_package integer CHECK (units_per_package > 0), -- individual units per package
  sort_order        integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_draft_lines_draft ON purchase_import_draft_lines(draft_id);

-- Idempotent column additions for existing databases
ALTER TABLE purchase_import_draft_lines ADD COLUMN IF NOT EXISTS package_type      text;
ALTER TABLE purchase_import_draft_lines ADD COLUMN IF NOT EXISTS units_per_package integer CHECK (units_per_package > 0);


-- ============================================================
-- SECTION 6: Shifts
-- ============================================================

-- ── shifts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  start_time  time        NOT NULL,
  end_time    time        NOT NULL,
  is_overnight boolean    NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON shifts(business_id);


-- ============================================================
-- SECTION 7: POS integrations
-- ============================================================

-- ── pos_connections ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_connections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pos_type        text        NOT NULL CHECK (pos_type IN ('square', 'toast', 'clover', 'lightspeed')),
  access_token    text        NOT NULL,
  refresh_token   text,
  token_expires_at timestamptz,
  merchant_id     text,
  location_id     text,
  location_name   text,
  connected_at    timestamptz DEFAULT now(),
  last_synced_at  timestamptz,
  is_active       boolean     DEFAULT true,
  UNIQUE (business_id, pos_type)
);
CREATE INDEX IF NOT EXISTS idx_pos_connections_business ON pos_connections(business_id);

-- ── pos_sync_logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_sync_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pos_type              text        NOT NULL,
  synced_at             timestamptz DEFAULT now(),
  period_start          date        NOT NULL,
  period_end            date        NOT NULL,
  transactions_imported integer     DEFAULT 0,
  status                text        NOT NULL CHECK (status IN ('success', 'error')),
  error_message         text
);
CREATE INDEX IF NOT EXISTS idx_pos_sync_logs_business ON pos_sync_logs(business_id, synced_at DESC);


-- ============================================================
-- SECTION 8: AI summaries
-- ============================================================

-- ── ai_summaries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_summaries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period_start date        NOT NULL,
  period_end   date        NOT NULL,
  summary_text text        NOT NULL,
  shift_label  text,                  -- shift label when summary was generated in shift mode
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_business ON ai_summaries(business_id, period_start, period_end);

-- Idempotent column additions for existing databases
ALTER TABLE ai_summaries ADD COLUMN IF NOT EXISTS shift_label text;


-- ============================================================
-- SECTION 9: Row Level Security
-- ============================================================

ALTER TABLE businesses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_item_aliases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_uploads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage_summaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_recipes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_aliases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_ingredients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_aliases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_profit_summaries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_uploads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_uploads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_import_drafts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_import_draft_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries                ENABLE ROW LEVEL SECURITY;
-- POS tables: managed via service role (API routes), but RLS enabled for compliance
ALTER TABLE pos_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sync_logs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pos_connections_business" ON pos_connections
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "pos_sync_logs_business" ON pos_sync_logs
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));


-- ============================================================
-- SECTION 10: Helper functions
-- ============================================================

-- Returns the business_id for the currently authenticated user
CREATE OR REPLACE FUNCTION current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT business_id
  FROM   user_businesses
  WHERE  user_id = auth.uid()
  LIMIT  1
$$;

-- Timestamp-aware sales query used by the calculations route.
-- Returns sales for a shift window, with date-only fallback for CSV rows.
CREATE OR REPLACE FUNCTION get_sales_in_shift(
  p_business_id uuid,
  p_shift_start timestamptz,
  p_shift_end   timestamptz,
  p_date_start  date,
  p_date_end    date
)
RETURNS TABLE (
  menu_item_id  uuid,
  quantity_sold numeric,
  gross_sales   numeric,
  guest_count   integer
)
LANGUAGE sql STABLE
AS $$
  SELECT
    menu_item_id,
    quantity_sold,
    gross_sales,
    guest_count
  FROM sales_transactions
  WHERE business_id = p_business_id
    AND menu_item_id IS NOT NULL
    AND (
      -- Precise path: POS or time-stamped CSV rows
      (sale_timestamp IS NOT NULL
       AND sale_timestamp >= p_shift_start
       AND sale_timestamp <  p_shift_end)
      OR
      -- Fallback path: date-only CSV rows (includes entire day for shift days)
      (sale_timestamp IS NULL
       AND sale_date >= p_date_start
       AND sale_date <= p_date_end)
    );
$$;


-- ============================================================
-- SECTION 11: RLS policies
-- ============================================================

-- ── user_businesses ──────────────────────────────────────────
DROP POLICY IF EXISTS "ub_select" ON user_businesses;
CREATE POLICY "ub_select" ON user_businesses
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ub_insert" ON user_businesses;
CREATE POLICY "ub_insert" ON user_businesses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── businesses ───────────────────────────────────────────────
DROP POLICY IF EXISTS "biz_select" ON businesses;
CREATE POLICY "biz_select" ON businesses
  FOR SELECT USING (id = current_business_id());

DROP POLICY IF EXISTS "biz_update" ON businesses;
CREATE POLICY "biz_update" ON businesses
  FOR UPDATE USING (id = current_business_id());

-- ── tenant_all macro (business_id column present) ────────────
DROP POLICY IF EXISTS "tenant_all" ON vendors;
CREATE POLICY "tenant_all" ON vendors
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON inventory_items;
CREATE POLICY "tenant_all" ON inventory_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON inventory_item_aliases;
CREATE POLICY "tenant_all" ON inventory_item_aliases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON inventory_count_uploads;
CREATE POLICY "tenant_all" ON inventory_count_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON inventory_counts;
CREATE POLICY "tenant_all" ON inventory_counts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON inventory_usage_summaries;
CREATE POLICY "tenant_all" ON inventory_usage_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON menu_items;
CREATE POLICY "tenant_all" ON menu_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON menu_item_recipes;
CREATE POLICY "tenant_all" ON menu_item_recipes
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE business_id = current_business_id()
    )
  )
  WITH CHECK (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE business_id = current_business_id()
    )
  );

DROP POLICY IF EXISTS "tenant_all" ON menu_item_aliases;
CREATE POLICY "tenant_all" ON menu_item_aliases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON drink_library_items;
CREATE POLICY "tenant_all" ON drink_library_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON drink_library_ingredients;
CREATE POLICY "tenant_all" ON drink_library_ingredients
  USING (
    drink_library_id IN (
      SELECT id FROM drink_library_items WHERE business_id = current_business_id()
    )
  )
  WITH CHECK (
    drink_library_id IN (
      SELECT id FROM drink_library_items WHERE business_id = current_business_id()
    )
  );

DROP POLICY IF EXISTS "tenant_all" ON drink_library_aliases;
CREATE POLICY "tenant_all" ON drink_library_aliases
  USING (
    drink_library_id IN (
      SELECT id FROM drink_library_items WHERE business_id = current_business_id()
    )
  )
  WITH CHECK (
    drink_library_id IN (
      SELECT id FROM drink_library_items WHERE business_id = current_business_id()
    )
  );

DROP POLICY IF EXISTS "tenant_all" ON drink_profit_summaries;
CREATE POLICY "tenant_all" ON drink_profit_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON sales_uploads;
CREATE POLICY "tenant_all" ON sales_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON sales_transactions;
CREATE POLICY "tenant_all" ON sales_transactions
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON purchase_uploads;
CREATE POLICY "tenant_all" ON purchase_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON purchases;
CREATE POLICY "tenant_all" ON purchases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON document_uploads;
CREATE POLICY "tenant_all" ON document_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON purchase_import_drafts;
CREATE POLICY "tenant_all" ON purchase_import_drafts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON purchase_import_draft_lines;
CREATE POLICY "tenant_all" ON purchase_import_draft_lines
  USING (
    draft_id IN (
      SELECT id FROM purchase_import_drafts WHERE business_id = current_business_id()
    )
  )
  WITH CHECK (
    draft_id IN (
      SELECT id FROM purchase_import_drafts WHERE business_id = current_business_id()
    )
  );

DROP POLICY IF EXISTS "tenant_all" ON shifts;
CREATE POLICY "tenant_all" ON shifts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

DROP POLICY IF EXISTS "tenant_all" ON ai_summaries;
CREATE POLICY "tenant_all" ON ai_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());
