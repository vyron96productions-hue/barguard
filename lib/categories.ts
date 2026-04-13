/** Canonical category lists — single source of truth for all UI dropdowns and type detection */

export const BEVERAGE_CATEGORIES = [
  'spirits', 'beer', 'wine', 'keg',
  'mixer', 'non-alcoholic', 'supply',
  'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac', 'liqueur',
]

export const FOOD_CATEGORIES = [
  'food', 'kitchen', 'proteins', 'produce', 'dairy', 'dry goods', 'frozen',
  'sauces', 'condiments', 'garnish', 'bread & starches', 'prep items', 'disposables',
]

export const PAPER_CATEGORIES = [
  'cups & lids', 'napkins', 'plates & bowls', 'to-go containers',
  'paper towels', 'straws & utensils', 'cleaning supplies', 'packaging',
]

export const PRESET_CATEGORIES = [...BEVERAGE_CATEGORIES, ...FOOD_CATEGORIES, ...PAPER_CATEGORIES, 'other']
