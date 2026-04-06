-- ============================================================
-- MISCELLANEOUS EXPENSE RECEIPT SCANNER
-- Migration: expenses_migration.sql
-- ============================================================

-- ─── Expense Categories ─────────────────────────────────────────────────────
-- business_id NULL = system default (visible to all businesses)

CREATE TABLE IF NOT EXISTS expense_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  parent_group text,           -- e.g. 'Operations', 'Admin', 'Facilities'
  is_system    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_business ON expense_categories(business_id);

-- ─── Expense Import Drafts ───────────────────────────────────────────────────
-- Mirrors purchase_import_drafts — pending OCR review before confirm

CREATE TABLE IF NOT EXISTS expense_import_drafts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_upload_id uuid REFERENCES document_uploads(id),
  vendor_name        text,
  receipt_date       date,
  subtotal           numeric(10,2),
  tax_amount         numeric(10,2),
  total_amount       numeric(10,2),
  payment_method     text,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','cancelled')),
  confidence         text NOT NULL DEFAULT 'medium'
                       CHECK (confidence IN ('high','medium','low')),
  warning_message    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  confirmed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_expense_import_drafts_business ON expense_import_drafts(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_import_drafts_status   ON expense_import_drafts(business_id, status);

-- ─── Expense Import Draft Lines ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_import_draft_lines (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id            uuid NOT NULL REFERENCES expense_import_drafts(id) ON DELETE CASCADE,
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  raw_item_name       text NOT NULL,
  quantity            numeric,
  unit_price          numeric(10,2),
  line_total          numeric(10,2),
  expense_category_id uuid REFERENCES expense_categories(id),
  confidence          text NOT NULL DEFAULT 'medium'
                        CHECK (confidence IN ('high','medium','low')),
  notes               text,
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_draft_lines_draft    ON expense_import_draft_lines(draft_id);
CREATE INDEX IF NOT EXISTS idx_expense_draft_lines_business ON expense_import_draft_lines(business_id);

-- ─── Confirmed Expense Receipts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_receipts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_upload_id uuid REFERENCES document_uploads(id),
  vendor_name        text,
  receipt_date       date NOT NULL,
  subtotal           numeric(10,2),
  tax_amount         numeric(10,2),
  total_amount       numeric(10,2) NOT NULL,
  payment_method     text,
  notes              text,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_business ON expense_receipts(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipts_date     ON expense_receipts(business_id, receipt_date DESC);

-- ─── Confirmed Expense Line Items ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_receipt_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id          uuid NOT NULL REFERENCES expense_receipts(id) ON DELETE CASCADE,
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  raw_item_name       text NOT NULL,
  quantity            numeric,
  unit_price          numeric(10,2),
  line_total          numeric(10,2),
  expense_category_id uuid REFERENCES expense_categories(id),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipt_items_receipt  ON expense_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipt_items_business ON expense_receipt_items(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipt_items_category ON expense_receipt_items(expense_category_id);

-- ─── Vendor → Category Memory ────────────────────────────────────────────────
-- Remembers which category a vendor was last assigned to

CREATE TABLE IF NOT EXISTS expense_vendor_hints (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  vendor_name         text NOT NULL,
  expense_category_id uuid NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  usage_count         integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, vendor_name)
);

CREATE INDEX IF NOT EXISTS idx_expense_vendor_hints_business ON expense_vendor_hints(business_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE expense_categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_import_drafts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_import_draft_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_receipts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_receipt_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_vendor_hints       ENABLE ROW LEVEL SECURITY;

-- Categories: system (business_id IS NULL) visible to all; custom scoped to business
CREATE POLICY "expense_categories_select" ON expense_categories
  FOR SELECT USING (business_id IS NULL OR business_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "expense_categories_insert" ON expense_categories
  FOR INSERT WITH CHECK (business_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "expense_categories_update" ON expense_categories
  FOR UPDATE USING (is_system = false AND business_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "expense_categories_delete" ON expense_categories
  FOR DELETE USING (is_system = false AND business_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

-- Drafts
CREATE POLICY "expense_import_drafts_all" ON expense_import_drafts
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

-- Draft lines
CREATE POLICY "expense_draft_lines_all" ON expense_import_draft_lines
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

-- Receipts
CREATE POLICY "expense_receipts_all" ON expense_receipts
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

-- Receipt items
CREATE POLICY "expense_receipt_items_all" ON expense_receipt_items
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

-- Vendor hints
CREATE POLICY "expense_vendor_hints_all" ON expense_vendor_hints
  USING (business_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid()));

-- ─── Seed System Categories ──────────────────────────────────────────────────

INSERT INTO expense_categories (business_id, name, parent_group, is_system) VALUES
  (NULL, 'Office Supplies',   'Admin',       true),
  (NULL, 'Cleaning Supplies', 'Operations',  true),
  (NULL, 'Maintenance',       'Facilities',  true),
  (NULL, 'Repairs',           'Facilities',  true),
  (NULL, 'Staff Supplies',    'Operations',  true),
  (NULL, 'Kitchen Supplies',  'Operations',  true),
  (NULL, 'Smallwares',        'Operations',  true),
  (NULL, 'Admin',             'Admin',       true),
  (NULL, 'Marketing',         'Admin',       true),
  (NULL, 'Utilities',         'Facilities',  true),
  (NULL, 'Other',             'Other',       true)
ON CONFLICT DO NOTHING;
