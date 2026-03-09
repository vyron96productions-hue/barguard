-- ─────────────────────────────────────────────────────────────────────────────
-- BarGuard: Shift-Based Analytics Migration
-- Run in Supabase SQL Editor — safe to run multiple times
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. sales_transactions — precise timestamp + guest count
ALTER TABLE sales_transactions
  ADD COLUMN IF NOT EXISTS sale_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS guest_count    integer CHECK (guest_count >= 0),
  ADD COLUMN IF NOT EXISTS check_id       text;     -- POS check / order reference

-- Index for timestamp-range queries (shift calculations)
CREATE INDEX IF NOT EXISTS idx_sales_tx_business_ts
  ON sales_transactions(business_id, sale_timestamp)
  WHERE sale_timestamp IS NOT NULL;

-- 2. inventory_counts — optional precise timestamp for shift-end counts
ALTER TABLE inventory_counts
  ADD COLUMN IF NOT EXISTS count_timestamp timestamptz;

CREATE INDEX IF NOT EXISTS idx_inv_counts_ts
  ON inventory_counts(business_id, count_timestamp)
  WHERE count_timestamp IS NOT NULL;

-- 3. inventory_usage_summaries — shift tracking and revenue/covers
--    NOTE: existing unique constraint (business_id, inventory_item_id, period_start, period_end)
--    is preserved for backward compatibility. Shift calculations overwrite same-period rows.
ALTER TABLE inventory_usage_summaries
  ADD COLUMN IF NOT EXISTS shift_start   timestamptz,
  ADD COLUMN IF NOT EXISTS shift_end     timestamptz,
  ADD COLUMN IF NOT EXISTS shift_label   text,
  ADD COLUMN IF NOT EXISTS total_revenue numeric,
  ADD COLUMN IF NOT EXISTS total_covers  integer;

-- 4. ai_summaries — optional shift label for richer AI context
ALTER TABLE ai_summaries
  ADD COLUMN IF NOT EXISTS shift_label text;

-- 5. shifts table — named preset definitions per business (editable in future)
CREATE TABLE IF NOT EXISTS shifts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        text NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_overnight boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON shifts(business_id);

-- 6. Seed default shift presets for existing businesses
DO $$
DECLARE
  biz RECORD;
BEGIN
  FOR biz IN SELECT id FROM businesses LOOP
    INSERT INTO shifts (business_id, name, start_time, end_time, is_overnight) VALUES
      (biz.id, 'Morning',    '06:00', '11:00', false),
      (biz.id, 'Lunch',      '11:00', '15:00', false),
      (biz.id, 'Happy Hour', '15:00', '19:00', false),
      (biz.id, 'Dinner',     '17:00', '21:00', false),
      (biz.id, 'Late Night', '21:00', '02:00', true),
      (biz.id, 'Full Day',   '00:00', '23:59', false)
    ON CONFLICT (business_id, name) DO NOTHING;
  END LOOP;
END $$;

-- 7. Postgres helper function: timestamp-aware sales query with date fallback
--    Used by the calculations route to handle both POS (timestamped) and CSV (date-only) data.
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
