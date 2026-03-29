-- BarGuard Demo Pricing Seed
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- It will upsert inventory items with costs, menu items with prices, and all recipes.

DO $$
DECLARE
  _bid uuid;
BEGIN
  SELECT id INTO _bid FROM businesses ORDER BY created_at LIMIT 1;

  IF _bid IS NULL THEN
    RAISE EXCEPTION 'No business found. Sign up at barguard.app first, then run this script.';
  END IF;

  RAISE NOTICE 'Seeding pricing data for business: %', _bid;

  -- ────────────────────────────────────────────────
  -- INVENTORY ITEMS
  -- Spirits tracked in oz. 750ml bottle = 25.36 oz.
  -- cost_per_oz = cost_per_unit / 25.36
  -- ────────────────────────────────────────────────
  INSERT INTO inventory_items (business_id, name, unit, category, item_type, cost_per_unit, cost_per_oz, pack_size, reorder_level)
  VALUES
    -- VODKA
    (_bid, 'Tito''s Vodka',           'oz', 'Vodka',    'beverage', 22.00, 0.8675, 1,  5),
    (_bid, 'Grey Goose Vodka',        'oz', 'Vodka',    'beverage', 35.00, 1.3802, 1,  3),
    (_bid, 'Absolut Vodka',           'oz', 'Vodka',    'beverage', 20.00, 0.7886, 1,  3),

    -- RUM
    (_bid, 'Bacardi White Rum',       'oz', 'Rum',      'beverage', 18.00, 0.7097, 1,  3),
    (_bid, 'Captain Morgan Spiced Rum','oz','Rum',      'beverage', 20.00, 0.7886, 1,  3),
    (_bid, 'Malibu Coconut Rum',      'oz', 'Rum',      'beverage', 18.00, 0.7097, 1,  2),

    -- TEQUILA
    (_bid, 'Patron Silver Tequila',   'oz', 'Tequila',  'beverage', 45.00, 1.7746, 1,  3),
    (_bid, 'Jose Cuervo Gold',        'oz', 'Tequila',  'beverage', 22.00, 0.8675, 1,  3),
    (_bid, 'Espolon Blanco',          'oz', 'Tequila',  'beverage', 28.00, 1.1040, 1,  2),

    -- GIN
    (_bid, 'Tanqueray Gin',           'oz', 'Gin',      'beverage', 25.00, 0.9858, 1,  3),
    (_bid, 'Hendrick''s Gin',         'oz', 'Gin',      'beverage', 38.00, 1.4990, 1,  2),
    (_bid, 'Bombay Sapphire Gin',     'oz', 'Gin',      'beverage', 26.00, 1.0252, 1,  2),

    -- WHISKEY / BOURBON
    (_bid, 'Jack Daniel''s Whiskey',  'oz', 'Whiskey',  'beverage', 28.00, 1.1040, 1,  5),
    (_bid, 'Jameson Irish Whiskey',   'oz', 'Whiskey',  'beverage', 32.00, 1.2617, 1,  3),
    (_bid, 'Maker''s Mark Bourbon',   'oz', 'Bourbon',  'beverage', 30.00, 1.1829, 1,  3),
    (_bid, 'Bulleit Bourbon',         'oz', 'Bourbon',  'beverage', 34.00, 1.3407, 1,  2),
    (_bid, 'Crown Royal',             'oz', 'Whiskey',  'beverage', 30.00, 1.1829, 1,  2),

    -- COGNAC / BRANDY
    (_bid, 'Hennessy VS',             'oz', 'Cognac',   'beverage', 45.00, 1.7746, 1,  2),

    -- LIQUEURS & MIXERS (also 750ml)
    (_bid, 'Kahlua',                  'oz', 'Liqueur',  'beverage', 22.00, 0.8675, 1,  2),
    (_bid, 'Baileys Irish Cream',     'oz', 'Liqueur',  'beverage', 28.00, 1.1040, 1,  2),
    (_bid, 'Triple Sec',              'oz', 'Liqueur',  'beverage', 12.00, 0.4732, 1,  2),
    (_bid, 'Blue Curacao',            'oz', 'Liqueur',  'beverage', 14.00, 0.5520, 1,  1),
    (_bid, 'Amaretto',                'oz', 'Liqueur',  'beverage', 16.00, 0.6309, 1,  1),
    (_bid, 'Peach Schnapps',          'oz', 'Liqueur',  'beverage', 14.00, 0.5520, 1,  1),
    (_bid, 'Midori Melon Liqueur',    'oz', 'Liqueur',  'beverage', 18.00, 0.7097, 1,  1),

    -- MIXERS (1 liter = 33.8 oz)
    (_bid, 'Simple Syrup',            'oz', 'Mixer',    'beverage',  3.00, 0.0888, 1,  2),
    (_bid, 'Fresh Lime Juice',        'oz', 'Mixer',    'beverage',  4.00, 0.1183, 1,  3),
    (_bid, 'Fresh Lemon Juice',       'oz', 'Mixer',    'beverage',  4.00, 0.1183, 1,  2),
    (_bid, 'Grenadine',               'oz', 'Mixer',    'beverage',  5.00, 0.1479, 1,  2),
    (_bid, 'Bitters',                 'oz', 'Mixer',    'beverage',  8.00, 0.2367, 1,  1),

    -- DRAFT BEER (15.5 gal keg = 1,984 oz, tracked in oz)
    (_bid, 'Bud Light Keg',           'oz', 'Draft Beer', 'beverage',  85.00, 0.0428, 1, 400),
    (_bid, 'Coors Light Keg',         'oz', 'Draft Beer', 'beverage',  90.00, 0.0454, 1, 400),
    (_bid, 'Miller Lite Keg',         'oz', 'Draft Beer', 'beverage',  88.00, 0.0444, 1, 400),
    (_bid, 'Blue Moon Keg',           'oz', 'Draft Beer', 'beverage', 105.00, 0.0529, 1, 200),
    (_bid, 'Stella Artois Keg',       'oz', 'Draft Beer', 'beverage', 115.00, 0.0580, 1, 200),

    -- BOTTLED BEER (12 oz bottles, tracked per bottle)
    (_bid, 'Corona Extra (bottle)',   'bottle', 'Bottled Beer', 'beverage', 1.25, NULL, 24, 24),
    (_bid, 'Heineken (bottle)',       'bottle', 'Bottled Beer', 'beverage', 1.50, NULL, 24, 24),
    (_bid, 'Modelo Especial (bottle)','bottle', 'Bottled Beer', 'beverage', 1.30, NULL, 24, 24),
    (_bid, 'Dos Equis (bottle)',      'bottle', 'Bottled Beer', 'beverage', 1.30, NULL, 24, 24),

    -- WINE (750ml = 25.36 oz, sell by 6 oz glass)
    (_bid, 'House Red Wine',          'oz', 'Wine',     'beverage',  8.00, 0.3155, 1,  5),
    (_bid, 'House White Wine',        'oz', 'Wine',     'beverage',  7.00, 0.2760, 1,  5),
    (_bid, 'Prosecco / Champagne',    'oz', 'Wine',     'beverage', 12.00, 0.4732, 1,  3)

  ON CONFLICT (business_id, name) DO UPDATE SET
    cost_per_unit = EXCLUDED.cost_per_unit,
    cost_per_oz   = EXCLUDED.cost_per_oz,
    pack_size     = EXCLUDED.pack_size,
    reorder_level = EXCLUDED.reorder_level,
    item_type     = EXCLUDED.item_type,
    category      = EXCLUDED.category;

  -- ────────────────────────────────────────────────
  -- MENU ITEMS WITH SELL PRICES
  -- ────────────────────────────────────────────────
  INSERT INTO menu_items (business_id, name, category, item_type, sell_price)
  VALUES
    -- VODKA COCKTAILS
    (_bid, 'Vodka Soda',              'Cocktails', 'drink', 10.00),
    (_bid, 'Vodka Cranberry',         'Cocktails', 'drink', 10.00),
    (_bid, 'Cosmopolitan',            'Cocktails', 'drink', 12.00),
    (_bid, 'Lemon Drop',              'Cocktails', 'drink', 11.00),
    (_bid, 'Moscow Mule',             'Cocktails', 'drink', 12.00),
    (_bid, 'Vodka Tonic',             'Cocktails', 'drink', 10.00),
    (_bid, 'Sex on the Beach',        'Cocktails', 'drink', 11.00),
    (_bid, 'Blue Lagoon',             'Cocktails', 'drink', 11.00),

    -- RUM COCKTAILS
    (_bid, 'Mojito',                  'Cocktails', 'drink', 12.00),
    (_bid, 'Rum & Coke',              'Cocktails', 'drink',  9.00),
    (_bid, 'Daiquiri',                'Cocktails', 'drink', 11.00),
    (_bid, 'Piña Colada',             'Cocktails', 'drink', 12.00),
    (_bid, 'Malibu Sunrise',          'Cocktails', 'drink', 11.00),

    -- TEQUILA COCKTAILS
    (_bid, 'Margarita',               'Cocktails', 'drink', 12.00),
    (_bid, 'Tequila Sunrise',         'Cocktails', 'drink', 11.00),
    (_bid, 'Paloma',                  'Cocktails', 'drink', 11.00),

    -- GIN COCKTAILS
    (_bid, 'Gin & Tonic',             'Cocktails', 'drink', 10.00),
    (_bid, 'Hendrick''s & Tonic',     'Cocktails', 'drink', 13.00),
    (_bid, 'Tom Collins',             'Cocktails', 'drink', 11.00),

    -- WHISKEY / BOURBON COCKTAILS
    (_bid, 'Jack & Coke',             'Cocktails', 'drink', 10.00),
    (_bid, 'Jameson on the Rocks',    'Cocktails', 'drink', 11.00),
    (_bid, 'Whiskey Sour',            'Cocktails', 'drink', 11.00),
    (_bid, 'Old Fashioned',           'Cocktails', 'drink', 13.00),
    (_bid, 'Manhattan',               'Cocktails', 'drink', 13.00),

    -- COGNAC
    (_bid, 'Hennessy & Coke',         'Cocktails', 'drink', 14.00),
    (_bid, 'Hennessy on the Rocks',   'Cocktails', 'drink', 14.00),

    -- SPECIALTY
    (_bid, 'White Russian',           'Cocktails', 'drink', 12.00),
    (_bid, 'Espresso Martini',        'Cocktails', 'drink', 13.00),
    (_bid, 'Amaretto Sour',           'Cocktails', 'drink', 11.00),
    (_bid, 'Midori Sour',             'Cocktails', 'drink', 11.00),

    -- SHOTS
    (_bid, 'Vodka Shot',              'Shots', 'drink',  6.00),
    (_bid, 'Tequila Shot',            'Shots', 'drink',  6.00),
    (_bid, 'Jameson Shot',            'Shots', 'drink',  7.00),
    (_bid, 'Patron Shot',             'Shots', 'drink',  9.00),
    (_bid, 'Hennessy Shot',           'Shots', 'drink',  9.00),
    (_bid, 'Fireball Shot',           'Shots', 'drink',  5.00),
    (_bid, 'Jager Bomb',              'Shots', 'drink',  7.00),

    -- DRAFT BEER
    (_bid, 'Draft Bud Light',         'Draft Beer', 'beer',  6.00),
    (_bid, 'Draft Coors Light',       'Draft Beer', 'beer',  6.00),
    (_bid, 'Draft Miller Lite',       'Draft Beer', 'beer',  6.00),
    (_bid, 'Draft Blue Moon',         'Draft Beer', 'beer',  7.00),
    (_bid, 'Draft Stella Artois',     'Draft Beer', 'beer',  7.00),

    -- BOTTLED BEER
    (_bid, 'Corona',                  'Bottled Beer', 'beer',  5.00),
    (_bid, 'Heineken',                'Bottled Beer', 'beer',  6.00),
    (_bid, 'Modelo Especial',         'Bottled Beer', 'beer',  5.50),
    (_bid, 'Dos Equis',               'Bottled Beer', 'beer',  5.50),

    -- WINE
    (_bid, 'Red Wine (glass)',        'Wine', 'drink',  9.00),
    (_bid, 'White Wine (glass)',      'Wine', 'drink',  9.00),
    (_bid, 'Prosecco (glass)',        'Wine', 'drink', 10.00)

  ON CONFLICT (business_id, name) DO UPDATE SET
    sell_price = EXCLUDED.sell_price,
    category   = EXCLUDED.category,
    item_type  = EXCLUDED.item_type;

  -- ────────────────────────────────────────────────
  -- RECIPES
  -- Remove existing recipes for these menu items, then re-insert cleanly.
  -- ────────────────────────────────────────────────
  DELETE FROM menu_item_recipes
  WHERE menu_item_id IN (
    SELECT id FROM menu_items WHERE business_id = _bid
  );

  INSERT INTO menu_item_recipes (menu_item_id, inventory_item_id, quantity, unit)
  SELECT m.id, i.id, r.qty, r.u FROM (VALUES

    -- Vodka Soda: 1.5oz Tito's
    ('Vodka Soda',            'Tito''s Vodka',           1.5,  'oz'),
    -- Vodka Cranberry: 1.5oz Tito's
    ('Vodka Cranberry',       'Tito''s Vodka',           1.5,  'oz'),
    -- Cosmopolitan: 1.5oz Tito's, 0.5oz Triple Sec, 0.5oz lime
    ('Cosmopolitan',          'Tito''s Vodka',           1.5,  'oz'),
    ('Cosmopolitan',          'Triple Sec',              0.5,  'oz'),
    ('Cosmopolitan',          'Fresh Lime Juice',        0.5,  'oz'),
    -- Lemon Drop: 1.5oz Tito's, 0.5oz Triple Sec, 0.75oz lemon
    ('Lemon Drop',            'Tito''s Vodka',           1.5,  'oz'),
    ('Lemon Drop',            'Triple Sec',              0.5,  'oz'),
    ('Lemon Drop',            'Fresh Lemon Juice',       0.75, 'oz'),
    -- Moscow Mule: 2oz Tito's, 0.5oz lime
    ('Moscow Mule',           'Tito''s Vodka',           2.0,  'oz'),
    ('Moscow Mule',           'Fresh Lime Juice',        0.5,  'oz'),
    -- Vodka Tonic: 1.5oz Tito's
    ('Vodka Tonic',           'Tito''s Vodka',           1.5,  'oz'),
    -- Sex on the Beach: 1.5oz Tito's, 0.5oz Peach Schnapps
    ('Sex on the Beach',      'Tito''s Vodka',           1.5,  'oz'),
    ('Sex on the Beach',      'Peach Schnapps',          0.5,  'oz'),
    -- Blue Lagoon: 1.5oz Tito's, 0.5oz Blue Curacao
    ('Blue Lagoon',           'Tito''s Vodka',           1.5,  'oz'),
    ('Blue Lagoon',           'Blue Curacao',            0.5,  'oz'),

    -- Mojito: 2oz Bacardi, 0.75oz simple syrup, 0.75oz lime
    ('Mojito',                'Bacardi White Rum',       2.0,  'oz'),
    ('Mojito',                'Simple Syrup',            0.75, 'oz'),
    ('Mojito',                'Fresh Lime Juice',        0.75, 'oz'),
    -- Rum & Coke: 1.5oz Captain Morgan
    ('Rum & Coke',            'Captain Morgan Spiced Rum', 1.5,'oz'),
    -- Daiquiri: 2oz Bacardi, 0.75oz simple syrup, 1oz lime
    ('Daiquiri',              'Bacardi White Rum',       2.0,  'oz'),
    ('Daiquiri',              'Simple Syrup',            0.75, 'oz'),
    ('Daiquiri',              'Fresh Lime Juice',        1.0,  'oz'),
    -- Malibu Sunrise: 1.5oz Malibu, 0.5oz grenadine
    ('Malibu Sunrise',        'Malibu Coconut Rum',      1.5,  'oz'),
    ('Malibu Sunrise',        'Grenadine',               0.5,  'oz'),

    -- Margarita: 2oz Patron, 0.75oz Triple Sec, 1oz lime
    ('Margarita',             'Patron Silver Tequila',   2.0,  'oz'),
    ('Margarita',             'Triple Sec',              0.75, 'oz'),
    ('Margarita',             'Fresh Lime Juice',        1.0,  'oz'),
    -- Tequila Sunrise: 1.5oz Cuervo, 0.5oz grenadine
    ('Tequila Sunrise',       'Jose Cuervo Gold',        1.5,  'oz'),
    ('Tequila Sunrise',       'Grenadine',               0.5,  'oz'),
    -- Paloma: 2oz Espolon, 0.5oz lime
    ('Paloma',                'Espolon Blanco',          2.0,  'oz'),
    ('Paloma',                'Fresh Lime Juice',        0.5,  'oz'),

    -- Gin & Tonic: 1.5oz Tanqueray
    ('Gin & Tonic',           'Tanqueray Gin',           1.5,  'oz'),
    -- Hendrick's & Tonic: 1.5oz Hendrick's
    ('Hendrick''s & Tonic',   'Hendrick''s Gin',         1.5,  'oz'),
    -- Tom Collins: 2oz Tanqueray, 0.75oz lemon, 0.5oz simple syrup
    ('Tom Collins',           'Tanqueray Gin',           2.0,  'oz'),
    ('Tom Collins',           'Fresh Lemon Juice',       0.75, 'oz'),
    ('Tom Collins',           'Simple Syrup',            0.5,  'oz'),

    -- Jack & Coke: 1.5oz Jack Daniel's
    ('Jack & Coke',           'Jack Daniel''s Whiskey',  1.5,  'oz'),
    -- Jameson on the Rocks: 2oz Jameson
    ('Jameson on the Rocks',  'Jameson Irish Whiskey',   2.0,  'oz'),
    -- Whiskey Sour: 2oz Maker's Mark, 0.75oz lemon, 0.5oz simple syrup
    ('Whiskey Sour',          'Maker''s Mark Bourbon',   2.0,  'oz'),
    ('Whiskey Sour',          'Fresh Lemon Juice',       0.75, 'oz'),
    ('Whiskey Sour',          'Simple Syrup',            0.5,  'oz'),
    -- Old Fashioned: 2oz Bulleit, 0.25oz simple syrup, dash bitters
    ('Old Fashioned',         'Bulleit Bourbon',         2.0,  'oz'),
    ('Old Fashioned',         'Simple Syrup',            0.25, 'oz'),
    ('Old Fashioned',         'Bitters',                 0.1,  'oz'),
    -- Manhattan: 2oz Crown Royal, 0.5oz simple syrup, dash bitters
    ('Manhattan',             'Crown Royal',             2.0,  'oz'),
    ('Manhattan',             'Simple Syrup',            0.5,  'oz'),
    ('Manhattan',             'Bitters',                 0.1,  'oz'),

    -- Hennessy & Coke: 1.5oz Hennessy
    ('Hennessy & Coke',       'Hennessy VS',             1.5,  'oz'),
    -- Hennessy on the Rocks: 2oz Hennessy
    ('Hennessy on the Rocks', 'Hennessy VS',             2.0,  'oz'),

    -- White Russian: 1.5oz Tito's, 0.75oz Kahlua, 0.75oz Baileys
    ('White Russian',         'Tito''s Vodka',           1.5,  'oz'),
    ('White Russian',         'Kahlua',                  0.75, 'oz'),
    ('White Russian',         'Baileys Irish Cream',     0.75, 'oz'),
    -- Espresso Martini: 1.5oz Tito's, 0.75oz Kahlua
    ('Espresso Martini',      'Tito''s Vodka',           1.5,  'oz'),
    ('Espresso Martini',      'Kahlua',                  0.75, 'oz'),
    -- Amaretto Sour: 1.5oz Amaretto, 0.75oz lemon
    ('Amaretto Sour',         'Amaretto',                1.5,  'oz'),
    ('Amaretto Sour',         'Fresh Lemon Juice',       0.75, 'oz'),
    -- Midori Sour: 1.5oz Midori, 0.75oz lemon
    ('Midori Sour',           'Midori Melon Liqueur',    1.5,  'oz'),
    ('Midori Sour',           'Fresh Lemon Juice',       0.75, 'oz'),

    -- SHOTS (1.5oz each)
    ('Vodka Shot',            'Tito''s Vodka',           1.5,  'oz'),
    ('Tequila Shot',          'Jose Cuervo Gold',        1.5,  'oz'),
    ('Jameson Shot',          'Jameson Irish Whiskey',   1.5,  'oz'),
    ('Patron Shot',           'Patron Silver Tequila',   1.5,  'oz'),
    ('Hennessy Shot',         'Hennessy VS',             1.5,  'oz'),

    -- DRAFT BEER (16oz pint pour)
    ('Draft Bud Light',       'Bud Light Keg',           16.0, 'oz'),
    ('Draft Coors Light',     'Coors Light Keg',         16.0, 'oz'),
    ('Draft Miller Lite',     'Miller Lite Keg',         16.0, 'oz'),
    ('Draft Blue Moon',       'Blue Moon Keg',           16.0, 'oz'),
    ('Draft Stella Artois',   'Stella Artois Keg',       16.0, 'oz'),

    -- BOTTLED BEER (1 bottle each)
    ('Corona',                'Corona Extra (bottle)',   1.0,  'bottle'),
    ('Heineken',              'Heineken (bottle)',        1.0,  'bottle'),
    ('Modelo Especial',       'Modelo Especial (bottle)',1.0,  'bottle'),
    ('Dos Equis',             'Dos Equis (bottle)',       1.0,  'bottle'),

    -- WINE (6oz glass pour)
    ('Red Wine (glass)',      'House Red Wine',          6.0,  'oz'),
    ('White Wine (glass)',    'House White Wine',        6.0,  'oz'),
    ('Prosecco (glass)',      'Prosecco / Champagne',    6.0,  'oz')

  ) AS r(menu_name, inv_name, qty, u)
  JOIN menu_items      m ON m.business_id = _bid AND m.name = r.menu_name
  JOIN inventory_items i ON i.business_id = _bid AND i.name = r.inv_name;

  RAISE NOTICE 'Done! Inventory items, menu items, and recipes seeded with standard bar pricing.';
END $$;
