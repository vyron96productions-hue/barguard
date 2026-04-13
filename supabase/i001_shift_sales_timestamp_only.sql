-- i001: Fix get_sales_in_shift to only include timestamped rows
--
-- The previous version had a fallback OR branch that included date-only rows
-- (sale_timestamp IS NULL) for the full day period. This caused every shift
-- to return identical full-day totals for bars whose data was imported via CSV.
--
-- Fix: remove the fallback. Shift calculations now require sale_timestamp to be
-- present. Bars using CSV imports (no timestamps) will see 0 expected usage in
-- shift mode — which is correct because those transactions cannot be attributed
-- to a specific shift window.

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
    -- Only rows with a precise timestamp can be attributed to a shift.
    -- Date-only rows (CSV imports) must be excluded — including them via a
    -- date fallback causes every shift to return identical full-day totals.
    AND sale_timestamp IS NOT NULL
    AND sale_timestamp >= p_shift_start
    AND sale_timestamp <  p_shift_end;
$$;
