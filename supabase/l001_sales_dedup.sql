-- l001_sales_dedup.sql
-- Prevents duplicate sales uploads and double-counted transactions.
--
-- 1. content_hash on sales_uploads — SHA-256 of the CSV/source content.
--    UNIQUE(business_id, content_hash) means uploading the same file twice
--    will fail at the DB level rather than silently doubling every deduction.
--
-- 2. Partial unique index on sales_transactions(business_id, check_id)
--    where check_id IS NOT NULL — prevents the same POS order from being
--    imported twice from different CSV exports or re-syncs.
--    Partial because check_id is NULL for most CSV rows that don't include it.

-- ── 1. content_hash on sales_uploads ─────────────────────────────────────────
ALTER TABLE sales_uploads
  ADD COLUMN IF NOT EXISTS content_hash text;

-- Unique per business — same file uploaded twice → conflict, not duplicate data
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_uploads_business_hash
  ON sales_uploads(business_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- ── 2. Dedup on POS check_id ──────────────────────────────────────────────────
-- Only applies to rows where check_id was provided by the POS system.
-- POS auto-sync already does delete+reinsert so this acts as a final safety net.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_tx_business_check_id
  ON sales_transactions(business_id, check_id)
  WHERE check_id IS NOT NULL;
