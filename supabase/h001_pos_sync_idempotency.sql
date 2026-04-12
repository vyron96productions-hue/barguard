-- h001_pos_sync_idempotency.sql
-- Adds pos_type to sales_uploads so POS syncs can be deduplicated by date range.
-- When the same date range is re-synced, existing transactions for those dates are
-- replaced (not doubled up). Run once in Supabase SQL editor.

ALTER TABLE sales_uploads ADD COLUMN IF NOT EXISTS pos_type text;

CREATE INDEX IF NOT EXISTS idx_sales_uploads_pos_type
  ON sales_uploads(business_id, pos_type)
  WHERE pos_type IS NOT NULL;
