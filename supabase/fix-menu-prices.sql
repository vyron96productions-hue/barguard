-- BarGuard Menu Price Fix
-- Paste and run in Supabase SQL Editor

DO $$
DECLARE _bid uuid := '778abd4c-86d9-454e-aaa4-403dfcfc886d';
BEGIN

-- Fix missing shot price
UPDATE menu_items SET sell_price = 9.00  WHERE business_id = _bid AND name = 'Patron silver';

-- COCKTAILS
UPDATE menu_items SET sell_price = 12.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Aperol Spritz';
UPDATE menu_items SET sell_price = 11.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Dark & Stormy';
UPDATE menu_items SET sell_price = 13.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Espresso Martini';
UPDATE menu_items SET sell_price = 10.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Gin & Tonic';
UPDATE menu_items SET sell_price = 11.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Lemon Drop';
UPDATE menu_items SET sell_price = 13.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Long Island Iced Tea';
UPDATE menu_items SET sell_price = 12.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Margarita';
UPDATE menu_items SET sell_price = 12.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Moscow Mule';
UPDATE menu_items SET sell_price = 12.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Negroni';
UPDATE menu_items SET sell_price = 13.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Old Fashioned';
UPDATE menu_items SET sell_price = 11.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Paloma';
UPDATE menu_items SET sell_price =  6.00, category = 'shot'     WHERE business_id = _bid AND name = 'Tequila Shot';
UPDATE menu_items SET sell_price = 10.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Vodka Soda';
UPDATE menu_items SET sell_price = 11.00, category = 'cocktail' WHERE business_id = _bid AND name = 'Whiskey Sour';

-- BEER (draft)
UPDATE menu_items SET sell_price =  7.00, category = 'beer' WHERE business_id = _bid AND name = 'Blue Moon Draft';

-- WINE
UPDATE menu_items SET sell_price =  9.00, category = 'wine' WHERE business_id = _bid AND name = 'House Red Glass';
UPDATE menu_items SET sell_price =  9.00, category = 'wine' WHERE business_id = _bid AND name = 'House White Glass';

-- FOOD
UPDATE menu_items SET sell_price = 13.00, category = 'entree'    WHERE business_id = _bid AND name = 'Buffalo Chicken Wrap';
UPDATE menu_items SET sell_price = 11.00, category = 'entree'    WHERE business_id = _bid AND name = 'Caesar Salad';
UPDATE menu_items SET sell_price = 14.00, category = 'entree'    WHERE business_id = _bid AND name = 'Chicken Sandwich';
UPDATE menu_items SET sell_price = 14.00, category = 'entree'    WHERE business_id = _bid AND name = 'Fish Tacos';
UPDATE menu_items SET sell_price =  8.00, category = 'side'      WHERE business_id = _bid AND name = 'Loaded Fries';
UPDATE menu_items SET sell_price = 12.00, category = 'appetizer' WHERE business_id = _bid AND name = 'Nachos';
UPDATE menu_items SET sell_price =  8.00, category = 'appetizer' WHERE business_id = _bid AND name = 'Pretzel Bites';
UPDATE menu_items SET sell_price = 11.00, category = 'entree'    WHERE business_id = _bid AND name = 'Quesadilla';
UPDATE menu_items SET sell_price = 10.00, category = 'appetizer' WHERE business_id = _bid AND name = 'Spinach Dip';
UPDATE menu_items SET sell_price = 13.00, category = 'entree'    WHERE business_id = _bid AND name = 'Street Tacos';

RAISE NOTICE 'All menu prices updated.';
END $$;
