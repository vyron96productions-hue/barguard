-- BarGuard Pricing Fix
-- Paste and run in Supabase SQL Editor
-- Uses exact item names from your database

DO $$
DECLARE _bid uuid := '778abd4c-86d9-454e-aaa4-403dfcfc886d';
BEGIN

-- ─────────────────────────────────────────
-- SPIRITS  (750ml bottle = 25.36 oz)
-- cost_per_unit = bottle price
-- cost_per_oz   = bottle price / 25.36
-- ─────────────────────────────────────────

-- VODKA
UPDATE inventory_items SET cost_per_unit = 22.00, cost_per_oz = 0.8675 WHERE business_id = _bid AND name = 'Tito''s Handmade Vodka';
UPDATE inventory_items SET cost_per_unit = 35.00, cost_per_oz = 1.3802 WHERE business_id = _bid AND name = 'Grey Goose Vodka';
UPDATE inventory_items SET cost_per_unit = 20.00, cost_per_oz = 0.7886 WHERE business_id = _bid AND name = 'Absolut Vodka';
UPDATE inventory_items SET cost_per_unit = 28.00, cost_per_oz = 1.1040 WHERE business_id = _bid AND name = 'Ketel One Vodka';
UPDATE inventory_items SET cost_per_unit = 15.00, cost_per_oz = 0.5915 WHERE business_id = _bid AND name = 'Smirnoff Vodka';

-- RUM
UPDATE inventory_items SET cost_per_unit = 18.00, cost_per_oz = 0.7097 WHERE business_id = _bid AND name = 'Bacardi White Rum';
UPDATE inventory_items SET cost_per_unit = 20.00, cost_per_oz = 0.7886 WHERE business_id = _bid AND name = 'Captain Morgan Spiced Rum';
UPDATE inventory_items SET cost_per_unit = 18.00, cost_per_oz = 0.7097 WHERE business_id = _bid AND name = 'Malibu Coconut Rum';
UPDATE inventory_items SET cost_per_unit = 28.00, cost_per_oz = 1.1040 WHERE business_id = _bid AND name = 'Baileys Irish Cream';

-- TEQUILA
UPDATE inventory_items SET cost_per_unit = 45.00, cost_per_oz = 1.7746 WHERE business_id = _bid AND name = 'Patron Silver Tequila';
UPDATE inventory_items SET cost_per_unit = 42.00, cost_per_oz = 1.6562 WHERE business_id = _bid AND name = 'Casamigos Blanco Tequila';
UPDATE inventory_items SET cost_per_unit = 48.00, cost_per_oz = 1.8928 WHERE business_id = _bid AND name = 'Don Julio Blanco Tequila';
UPDATE inventory_items SET cost_per_unit = 22.00, cost_per_oz = 0.8675 WHERE business_id = _bid AND name = 'Jose Cuervo Gold Tequila';

-- GIN
UPDATE inventory_items SET cost_per_unit = 25.00, cost_per_oz = 0.9858 WHERE business_id = _bid AND name = 'Tanqueray London Dry Gin';
UPDATE inventory_items SET cost_per_unit = 38.00, cost_per_oz = 1.4990 WHERE business_id = _bid AND name = 'Hendrick''s Gin';
UPDATE inventory_items SET cost_per_unit = 26.00, cost_per_oz = 1.0252 WHERE business_id = _bid AND name = 'Bombay Sapphire Gin';

-- WHISKEY / BOURBON
UPDATE inventory_items SET cost_per_unit = 28.00, cost_per_oz = 1.1040 WHERE business_id = _bid AND name = 'Jack Daniel''s Tennessee Whiskey';
UPDATE inventory_items SET cost_per_unit = 32.00, cost_per_oz = 1.2617 WHERE business_id = _bid AND name = 'Jameson Irish Whiskey';
UPDATE inventory_items SET cost_per_unit = 30.00, cost_per_oz = 1.1829 WHERE business_id = _bid AND name = 'Maker''s Mark Bourbon';
UPDATE inventory_items SET cost_per_unit = 34.00, cost_per_oz = 1.3407 WHERE business_id = _bid AND name = 'Bulleit Bourbon';
UPDATE inventory_items SET cost_per_unit = 30.00, cost_per_oz = 1.1829 WHERE business_id = _bid AND name = 'Crown Royal Canadian Whisky';
UPDATE inventory_items SET cost_per_unit = 38.00, cost_per_oz = 1.4990 WHERE business_id = _bid AND name = 'Johnnie Walker Black Label';
UPDATE inventory_items SET cost_per_unit = 28.00, cost_per_oz = 1.1040 WHERE business_id = _bid AND name = 'Dewars White Label Scotch';
UPDATE inventory_items SET cost_per_unit = 18.00, cost_per_oz = 0.7097 WHERE business_id = _bid AND name = 'Fireball Cinnamon Whisky';
UPDATE inventory_items SET cost_per_unit = 42.00, cost_per_oz = 1.6562 WHERE business_id = _bid AND name = 'Woodford Reserve Bourbon';

-- COGNAC
UPDATE inventory_items SET cost_per_unit = 45.00, cost_per_oz = 1.7746 WHERE business_id = _bid AND name = 'Hennessy VS Cognac';
UPDATE inventory_items SET cost_per_unit = 55.00, cost_per_oz = 2.1688 WHERE business_id = _bid AND name = 'Remy Martin VSOP';

-- LIQUEURS / SPIRITS
UPDATE inventory_items SET cost_per_unit = 22.00, cost_per_oz = 0.8675 WHERE business_id = _bid AND name = 'Kahlua Coffee Liqueur';
UPDATE inventory_items SET cost_per_unit = 22.00, cost_per_oz = 0.8675 WHERE business_id = _bid AND name = 'Amaretto Di Saronno';

-- WINE (750ml = 25.36 oz)
UPDATE inventory_items SET cost_per_unit = 10.00, cost_per_oz = 0.3943 WHERE business_id = _bid AND name = 'House Cabernet Sauvignon';
UPDATE inventory_items SET cost_per_unit =  8.00, cost_per_oz = 0.3155 WHERE business_id = _bid AND name = 'House Chardonnay';
UPDATE inventory_items SET cost_per_unit =  8.00, cost_per_oz = 0.3155 WHERE business_id = _bid AND name = 'House Pinot Grigio';
UPDATE inventory_items SET cost_per_unit = 12.00, cost_per_oz = 0.4732 WHERE business_id = _bid AND name = 'Prosecco';

-- ─────────────────────────────────────────
-- BEER (bottled — cost per bottle)
-- ─────────────────────────────────────────
UPDATE inventory_items SET cost_per_unit = 0.90 WHERE business_id = _bid AND name = 'Bud Light';
UPDATE inventory_items SET cost_per_unit = 0.95 WHERE business_id = _bid AND name = 'Budweiser';
UPDATE inventory_items SET cost_per_unit = 0.90 WHERE business_id = _bid AND name = 'Coors Light';
UPDATE inventory_items SET cost_per_unit = 1.25 WHERE business_id = _bid AND name = 'Corona Extra';
UPDATE inventory_items SET cost_per_unit = 1.50 WHERE business_id = _bid AND name = 'Heineken';
UPDATE inventory_items SET cost_per_unit = 0.90 WHERE business_id = _bid AND name = 'Miller Lite';
UPDATE inventory_items SET cost_per_unit = 1.30 WHERE business_id = _bid AND name = 'Modelo Especial';
UPDATE inventory_items SET cost_per_unit = 1.75 WHERE business_id = _bid AND name = 'Blue Moon Belgian White';
UPDATE inventory_items SET cost_per_unit = 1.60 WHERE business_id = _bid AND name = 'Sam Adams Boston Lager';
UPDATE inventory_items SET cost_per_unit = 1.50 WHERE business_id = _bid AND name = 'Stella Artois';

-- ─────────────────────────────────────────
-- KEGS (cost per keg)
-- ─────────────────────────────────────────
UPDATE inventory_items SET cost_per_unit = 85.00,  cost_per_oz = 0.0428 WHERE business_id = _bid AND name = 'Bud Light Keg';
UPDATE inventory_items SET cost_per_unit = 90.00,  cost_per_oz = 0.0454 WHERE business_id = _bid AND name = 'Coors Light Keg';

-- ─────────────────────────────────────────
-- MIXERS / JUICES (cost per oz)
-- 1L container (~33.8 oz)
-- ─────────────────────────────────────────
UPDATE inventory_items SET cost_per_unit = 4.00,  cost_per_oz = 0.1183 WHERE business_id = _bid AND name = 'Lime Juice';
UPDATE inventory_items SET cost_per_unit = 3.00,  cost_per_oz = 0.0888 WHERE business_id = _bid AND name = 'Simple Syrup';
UPDATE inventory_items SET cost_per_unit = 0.05,  cost_per_oz = 0.0500 WHERE business_id = _bid AND name = 'Sprite';
UPDATE inventory_items SET cost_per_unit = 0.05,  cost_per_oz = 0.0500 WHERE business_id = _bid AND name = 'Tonic Water';
UPDATE inventory_items SET cost_per_unit = 0.03,  cost_per_oz = 0.0300 WHERE business_id = _bid AND name = 'Club Soda';
UPDATE inventory_items SET cost_per_unit = 0.05,  cost_per_oz = 0.0500 WHERE business_id = _bid AND name = 'Coca-Cola';
UPDATE inventory_items SET cost_per_unit = 0.05,  cost_per_oz = 0.0500 WHERE business_id = _bid AND name = 'Diet Coke';
UPDATE inventory_items SET cost_per_unit = 5.00,  cost_per_oz = 0.1479 WHERE business_id = _bid AND name = 'Grenadine';
UPDATE inventory_items SET cost_per_unit = 3.50,  cost_per_oz = 0.1036 WHERE business_id = _bid AND name = 'Cranberry Juice';
UPDATE inventory_items SET cost_per_unit = 3.00,  cost_per_oz = 0.0888 WHERE business_id = _bid AND name = 'Orange Juice';
UPDATE inventory_items SET cost_per_unit = 3.50,  cost_per_oz = 0.1036 WHERE business_id = _bid AND name = 'Pineapple Juice';

-- ─────────────────────────────────────────
-- FOOD (cost per serving/unit)
-- ─────────────────────────────────────────
UPDATE inventory_items SET cost_per_unit = 0.15 WHERE business_id = _bid AND name = 'American Cheese Slices';
UPDATE inventory_items SET cost_per_unit = 0.50 WHERE business_id = _bid AND name = 'Bacon Strips';
UPDATE inventory_items SET cost_per_unit = 0.40 WHERE business_id = _bid AND name = 'Burger Buns';
UPDATE inventory_items SET cost_per_unit = 1.50 WHERE business_id = _bid AND name = 'Burger Patties 4oz';
UPDATE inventory_items SET cost_per_unit = 1.20 WHERE business_id = _bid AND name = 'Chicken Wings';
UPDATE inventory_items SET cost_per_unit = 0.80 WHERE business_id = _bid AND name = 'Frozen French Fries';
UPDATE inventory_items SET cost_per_unit = 1.50 WHERE business_id = _bid AND name = 'Mozzarella Sticks';
UPDATE inventory_items SET cost_per_unit = 0.30 WHERE business_id = _bid AND name = 'Nacho Cheese Sauce';
UPDATE inventory_items SET cost_per_unit = 0.60 WHERE business_id = _bid AND name = 'Tortilla Chips';
UPDATE inventory_items SET cost_per_unit = 0.25 WHERE business_id = _bid AND name = 'Salsa';
UPDATE inventory_items SET cost_per_unit = 0.20 WHERE business_id = _bid AND name = 'Sour Cream';
UPDATE inventory_items SET cost_per_unit = 0.10 WHERE business_id = _bid AND name = 'Jalapeños';
UPDATE inventory_items SET cost_per_unit = 0.10 WHERE business_id = _bid AND name = 'Shredded Lettuce';
UPDATE inventory_items SET cost_per_unit = 0.15 WHERE business_id = _bid AND name = 'Sliced Tomatoes';

RAISE NOTICE 'All inventory costs updated.';
END $$;
