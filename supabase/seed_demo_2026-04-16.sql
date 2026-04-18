-- ============================================================
-- Demo data for 2026-04-16 — sales log + purchase order
-- Run in Supabase SQL Editor (uses your real business/item IDs)
-- Safe to re-run: delete block at top removes prior demo data.
-- ============================================================

DO $$
DECLARE
  v_business_id       uuid;
  v_sales_upload_id   uuid;
  v_purchase_upload_id uuid;

  -- menu item IDs (pulled from your real data)
  mid_french_dip      uuid;
  mid_burger          uuid;
  mid_wings           uuid;
  mid_nachos          uuid;
  mid_margarita       uuid;
  mid_old_fashioned   uuid;
  mid_vodka_soda      uuid;
  mid_rum_coke        uuid;
  mid_bud_light       uuid;
  mid_modelo          uuid;
  mid_sprite          uuid;
  mid_water           uuid;

  -- inventory item IDs
  iid_beef            uuid;
  iid_chicken         uuid;
  iid_cheese          uuid;
  iid_bun             uuid;
  iid_tequila         uuid;
  iid_triple_sec      uuid;
  iid_lime_juice      uuid;
  iid_bourbon         uuid;
  iid_vodka           uuid;
  iid_rum             uuid;
  iid_bud_light       uuid;
  iid_modelo          uuid;
  iid_sprite          uuid;
  iid_au_jus          uuid;

BEGIN
  -- ── 1. Get business_id ──────────────────────────────────────
  SELECT b.id INTO v_business_id
  FROM businesses b
  JOIN user_businesses ub ON ub.business_id = b.id
  WHERE ub.membership_status = 'active'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'No active business found';
  END IF;

  -- ── 2. Clean up any prior demo run for this date ───────────
  DELETE FROM sales_uploads
  WHERE business_id = v_business_id
    AND filename = 'demo-sales-2026-04-16';

  DELETE FROM purchase_uploads
  WHERE business_id = v_business_id
    AND filename = 'demo-purchases-2026-04-16';

  -- ── 3. Create upload parent rows ───────────────────────────
  INSERT INTO sales_uploads (business_id, filename, sale_date, row_count)
  VALUES (v_business_id, 'demo-sales-2026-04-16', '2026-04-16', 12)
  RETURNING id INTO v_sales_upload_id;

  INSERT INTO purchase_uploads (business_id, filename, upload_date, row_count)
  VALUES (v_business_id, 'demo-purchases-2026-04-16', '2026-04-16', 8)
  RETURNING id INTO v_purchase_upload_id;

  -- ── 4. Resolve menu item IDs (best-effort name match) ──────
  SELECT id INTO mid_french_dip   FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%french dip%'   LIMIT 1;
  SELECT id INTO mid_burger       FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%burger%'        LIMIT 1;
  SELECT id INTO mid_wings        FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%wing%'          LIMIT 1;
  SELECT id INTO mid_nachos       FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%nacho%'         LIMIT 1;
  SELECT id INTO mid_margarita    FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%margarita%'     LIMIT 1;
  SELECT id INTO mid_old_fashioned FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%old fashion%'  LIMIT 1;
  SELECT id INTO mid_vodka_soda   FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%vodka soda%'    LIMIT 1;
  SELECT id INTO mid_rum_coke     FROM menu_items WHERE business_id = v_business_id AND (lower(name) LIKE '%rum%coke%' OR lower(name) LIKE '%rum & coke%') LIMIT 1;
  SELECT id INTO mid_bud_light    FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%bud light%'     LIMIT 1;
  SELECT id INTO mid_modelo       FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%modelo%'        LIMIT 1;
  SELECT id INTO mid_sprite       FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%sprite%'        LIMIT 1;
  SELECT id INTO mid_water        FROM menu_items WHERE business_id = v_business_id AND lower(name) LIKE '%water%'         LIMIT 1;

  -- ── 5. Insert sales transactions ───────────────────────────
  -- Food
  INSERT INTO sales_transactions (upload_id, business_id, sale_date, raw_item_name, menu_item_id, quantity_sold, gross_sales)
  VALUES
    (v_sales_upload_id, v_business_id, '2026-04-16', 'French Dip',     mid_french_dip,   7,  111.93),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Burger',         mid_burger,       12, 167.88),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Wings',          mid_wings,        9,  134.91),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Nachos',         mid_nachos,       5,  64.95),
  -- Cocktails
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Margarita',      mid_margarita,    18, 198.00),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Old Fashioned',  mid_old_fashioned, 11, 143.00),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Vodka Soda',     mid_vodka_soda,   14, 126.00),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Rum & Coke',     mid_rum_coke,     8,  80.00),
  -- Beer
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Bud Light',      mid_bud_light,    22, 132.00),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Modelo',         mid_modelo,       15, 105.00),
  -- Non-alc
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Sprite',         mid_sprite,       6,  18.00),
    (v_sales_upload_id, v_business_id, '2026-04-16', 'Water',          mid_water,        10,  0.00);

  -- ── 6. Resolve inventory item IDs ──────────────────────────
  SELECT id INTO iid_beef       FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%sirloin%'    LIMIT 1;
  SELECT id INTO iid_beef       FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%beef%'       LIMIT 1 WHERE iid_beef IS NULL;
  SELECT id INTO iid_chicken    FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%chicken%'    LIMIT 1;
  SELECT id INTO iid_cheese     FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%provolone%'  LIMIT 1;
  SELECT id INTO iid_cheese     FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%cheese%'     LIMIT 1 WHERE iid_cheese IS NULL;
  SELECT id INTO iid_bun        FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%bun%'        LIMIT 1;
  SELECT id INTO iid_tequila    FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%tequila%'    LIMIT 1;
  SELECT id INTO iid_triple_sec FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%triple sec%' LIMIT 1;
  SELECT id INTO iid_lime_juice FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%lime%'       LIMIT 1;
  SELECT id INTO iid_bourbon    FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%bourbon%'    LIMIT 1;
  SELECT id INTO iid_vodka      FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%vodka%'      LIMIT 1;
  SELECT id INTO iid_rum        FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%rum%'        LIMIT 1;
  SELECT id INTO iid_bud_light  FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%bud light%'  LIMIT 1;
  SELECT id INTO iid_modelo     FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%modelo%'     LIMIT 1;
  SELECT id INTO iid_sprite     FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%sprite%'     LIMIT 1;
  SELECT id INTO iid_au_jus     FROM inventory_items WHERE business_id = v_business_id AND lower(name) LIKE '%au jus%'     LIMIT 1;

  -- ── 7. Insert purchases ────────────────────────────────────
  INSERT INTO purchases (upload_id, business_id, purchase_date, raw_item_name, inventory_item_id, quantity_purchased, unit_cost, unit_type, vendor_name)
  VALUES
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Shaved Sirloin',    iid_beef,       10,    18.50, 'lb',      'Sysco'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Chicken Wings',     iid_chicken,    15,    4.20,  'lb',      'Sysco'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Cheese Provolone',  iid_cheese,     5,     6.80,  'lb',      'Sysco'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Hoagie Buns',       iid_bun,        2,     12.00, 'each',    'Sysco'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Tequila Silver',    iid_tequila,    6,     22.00, 'bottle',  'Republic National'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Bourbon Whiskey',   iid_bourbon,    4,     28.00, 'bottle',  'Republic National'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Vodka',             iid_vodka,      6,     18.00, 'bottle',  'Republic National'),
    (v_purchase_upload_id, v_business_id, '2026-04-16', 'Bud Light Case',    iid_bud_light,  3,     24.00, 'case',    'Budweiser Dist.');

  RAISE NOTICE 'Done — business: %, sales_upload: %, purchase_upload: %',
    v_business_id, v_sales_upload_id, v_purchase_upload_id;
END $$;
