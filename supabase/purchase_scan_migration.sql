-- Purchase Scan Import Migration
-- Run this in your Supabase SQL editor after the main schema.sql

-- ───────────────────────────────────────────
-- document_uploads
-- Stores uploaded receipt / invoice files for scan import
-- ───────────────────────────────────────────
create table if not exists document_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  filename text not null,
  file_type text not null,           -- 'image/jpeg', 'image/png', 'application/pdf'
  file_data text,                    -- base64-encoded file content (used for in-browser preview)
  raw_extracted_text text,           -- raw text extracted / returned by OCR
  created_at timestamptz not null default now()
);
create index if not exists idx_document_uploads_business on document_uploads(business_id);

-- ───────────────────────────────────────────
-- purchase_import_drafts
-- Draft header created after scanning a document
-- ───────────────────────────────────────────
create table if not exists purchase_import_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  document_upload_id uuid references document_uploads(id) on delete set null,
  vendor_name text,
  purchase_date date,
  status text not null default 'pending',     -- 'pending' | 'confirmed' | 'cancelled'
  confidence text not null default 'high',    -- 'high' | 'medium' | 'low'
  warning_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists idx_purchase_import_drafts_business on purchase_import_drafts(business_id);

-- ───────────────────────────────────────────
-- purchase_import_draft_lines
-- Individual parsed line items within a draft
-- ───────────────────────────────────────────
create table if not exists purchase_import_draft_lines (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references purchase_import_drafts(id) on delete cascade,
  raw_item_name text not null,
  inventory_item_id uuid references inventory_items(id),
  quantity numeric,
  unit_type text,
  unit_cost numeric,
  line_total numeric,
  match_status text not null default 'unmatched',  -- 'matched' | 'unmatched' | 'manual'
  confidence text not null default 'high',          -- 'high' | 'medium' | 'low'
  is_approved boolean not null default true,
  sort_order integer not null default 0
);
create index if not exists idx_draft_lines_draft on purchase_import_draft_lines(draft_id);

-- ───────────────────────────────────────────
-- Add optional scan source column to purchase_uploads
-- so confirmed scan imports remain traceable
-- ───────────────────────────────────────────
alter table purchase_uploads
  add column if not exists document_upload_id uuid references document_uploads(id) on delete set null;
