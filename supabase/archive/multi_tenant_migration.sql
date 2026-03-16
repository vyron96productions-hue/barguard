-- ============================================================
-- Multi-tenant migration: user_businesses + RLS
-- Run this in Supabase SQL editor AFTER enabling Email auth.
-- ============================================================

-- ── 1. Businesses table (may already exist from initial seed) ──────────────
CREATE TABLE IF NOT EXISTS businesses (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── 2. User → Business join table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_businesses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'owner',
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- ── 3. Helper: current user's business_id ─────────────────────────────────
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

-- ── 4. Enable RLS on all tables with business_id ──────────────────────────
ALTER TABLE businesses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_uploads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage_summaries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_aliases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_item_aliases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_uploads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_uploads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_import_drafts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_import_draft_lines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_connections              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sync_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_ingredients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_library_aliases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_profit_summaries       ENABLE ROW LEVEL SECURITY;

-- ── 5. Policies: user_businesses (users see their own rows) ───────────────
DROP POLICY IF EXISTS "ub_select" ON user_businesses;
CREATE POLICY "ub_select" ON user_businesses
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ub_insert" ON user_businesses;
CREATE POLICY "ub_insert" ON user_businesses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── 6. Policies: businesses ───────────────────────────────────────────────
DROP POLICY IF EXISTS "biz_select" ON businesses;
CREATE POLICY "biz_select" ON businesses
  FOR SELECT USING (id = current_business_id());

DROP POLICY IF EXISTS "biz_update" ON businesses;
CREATE POLICY "biz_update" ON businesses
  FOR UPDATE USING (id = current_business_id());

-- ── 7. Macro for tables with business_id column ───────────────────────────
-- inventory_items
DROP POLICY IF EXISTS "tenant_all" ON inventory_items;
CREATE POLICY "tenant_all" ON inventory_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- inventory_counts
DROP POLICY IF EXISTS "tenant_all" ON inventory_counts;
CREATE POLICY "tenant_all" ON inventory_counts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- inventory_count_uploads
DROP POLICY IF EXISTS "tenant_all" ON inventory_count_uploads;
CREATE POLICY "tenant_all" ON inventory_count_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- inventory_usage_summaries
DROP POLICY IF EXISTS "tenant_all" ON inventory_usage_summaries;
CREATE POLICY "tenant_all" ON inventory_usage_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- menu_items
DROP POLICY IF EXISTS "tenant_all" ON menu_items;
CREATE POLICY "tenant_all" ON menu_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- menu_item_recipes (via menu_items)
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

-- menu_item_aliases
DROP POLICY IF EXISTS "tenant_all" ON menu_item_aliases;
CREATE POLICY "tenant_all" ON menu_item_aliases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- inventory_item_aliases
DROP POLICY IF EXISTS "tenant_all" ON inventory_item_aliases;
CREATE POLICY "tenant_all" ON inventory_item_aliases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- sales_transactions
DROP POLICY IF EXISTS "tenant_all" ON sales_transactions;
CREATE POLICY "tenant_all" ON sales_transactions
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- sales_uploads
DROP POLICY IF EXISTS "tenant_all" ON sales_uploads;
CREATE POLICY "tenant_all" ON sales_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- purchases
DROP POLICY IF EXISTS "tenant_all" ON purchases;
CREATE POLICY "tenant_all" ON purchases
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- purchase_uploads
DROP POLICY IF EXISTS "tenant_all" ON purchase_uploads;
CREATE POLICY "tenant_all" ON purchase_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- purchase_import_drafts
DROP POLICY IF EXISTS "tenant_all" ON purchase_import_drafts;
CREATE POLICY "tenant_all" ON purchase_import_drafts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- purchase_import_draft_lines (via purchase_import_drafts)
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

-- document_uploads
DROP POLICY IF EXISTS "tenant_all" ON document_uploads;
CREATE POLICY "tenant_all" ON document_uploads
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ai_summaries
DROP POLICY IF EXISTS "tenant_all" ON ai_summaries;
CREATE POLICY "tenant_all" ON ai_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- pos_connections
DROP POLICY IF EXISTS "tenant_all" ON pos_connections;
CREATE POLICY "tenant_all" ON pos_connections
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- pos_sync_logs
DROP POLICY IF EXISTS "tenant_all" ON pos_sync_logs;
CREATE POLICY "tenant_all" ON pos_sync_logs
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- drink_library_items
DROP POLICY IF EXISTS "tenant_all" ON drink_library_items;
CREATE POLICY "tenant_all" ON drink_library_items
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- drink_library_ingredients (via drink_library_items)
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

-- drink_library_aliases (via drink_library_items)
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

-- drink_profit_summaries
DROP POLICY IF EXISTS "tenant_all" ON drink_profit_summaries;
CREATE POLICY "tenant_all" ON drink_profit_summaries
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());
