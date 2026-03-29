-- BarGuard Reorder Levels
-- Paste and run in Supabase SQL Editor
-- Sets reorder thresholds on high-movement items so alerts appear on dashboard

DO $$
DECLARE _bid uuid := '778abd4c-86d9-454e-aaa4-403dfcfc886d';
BEGIN

-- SPIRITS (oz) — alert when below ~2 bottles (50oz)
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Tito''s Handmade Vodka';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Jack Daniel''s Tennessee Whiskey';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Jameson Irish Whiskey';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Patron Silver Tequila';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Hennessy VS Cognac';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'Grey Goose Vodka';
UPDATE inventory_items SET reorder_level = 25 WHERE business_id = _bid AND name = 'Bacardi White Rum';
UPDATE inventory_items SET reorder_level = 25 WHERE business_id = _bid AND name = 'Captain Morgan Spiced Rum';

-- KEGS (oz) — alert when below ~400oz (roughly 1/5 keg)
UPDATE inventory_items SET reorder_level = 400 WHERE business_id = _bid AND name = 'Bud Light Keg';
UPDATE inventory_items SET reorder_level = 400 WHERE business_id = _bid AND name = 'Coors Light Keg';

-- BOTTLED BEER — alert when below 12 bottles (half case)
UPDATE inventory_items SET reorder_level = 12 WHERE business_id = _bid AND name = 'Corona Extra';
UPDATE inventory_items SET reorder_level = 12 WHERE business_id = _bid AND name = 'Modelo Especial';

-- WINE (oz) — alert when below ~50oz (~2 bottles)
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'House Cabernet Sauvignon';
UPDATE inventory_items SET reorder_level = 50 WHERE business_id = _bid AND name = 'House Chardonnay';

RAISE NOTICE 'Reorder levels set on 14 items.';
END $$;
