-- Fix mutable search_path warnings on all SECURITY DEFINER / public functions.
-- Adding SET search_path = public prevents search_path injection attacks.

CREATE OR REPLACE FUNCTION current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id
  FROM   user_businesses
  WHERE  user_id           = auth.uid()
    AND  membership_status = 'active'
  LIMIT  1
$$;

CREATE OR REPLACE FUNCTION current_client_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN role = 'owner' THEN 'admin'
    ELSE client_role
  END
  FROM user_businesses
  WHERE user_id           = auth.uid()
    AND membership_status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION is_business_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_id           = auth.uid()
      AND membership_status = 'active'
      AND role              = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION has_minimum_client_role(required text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE current_client_role()
    WHEN 'admin'    THEN true
    WHEN 'manager'  THEN required IN ('manager','employee')
    WHEN 'employee' THEN required = 'employee'
    ELSE false
  END
$$;

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
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    menu_item_id,
    quantity_sold,
    gross_sales,
    guest_count
  FROM sales_transactions
  WHERE business_id = p_business_id
    AND menu_item_id IS NOT NULL
    AND sale_timestamp IS NOT NULL
    AND sale_timestamp >= p_shift_start
    AND sale_timestamp <  p_shift_end;
$$;
