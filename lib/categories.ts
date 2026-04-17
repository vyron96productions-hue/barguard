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

// ---------------------------------------------------------------------------
// Pre-built sets for O(1) lookup — used by API routes for item_type inference
// ---------------------------------------------------------------------------

/** Categories that imply item_type = 'food'. Includes legacy aliases for forward-compat. */
const FOOD_CAT_SET = new Set([
  ...FOOD_CATEGORIES.map((c) => c.toLowerCase()),
  'protein',   // legacy singular — some existing items may have this
  'dessert',   // legacy — old inline set included this
])

/** Categories that imply item_type = 'paper'. */
const PAPER_CAT_SET = new Set(PAPER_CATEGORIES.map((c) => c.toLowerCase()))

/**
 * Categories that imply item_type = 'beverage'.
 * 'supply' is intentionally excluded — it is too ambiguous to force a beverage type.
 */
const BEVERAGE_CAT_SET = new Set(
  BEVERAGE_CATEGORIES.filter((c) => c !== 'supply').map((c) => c.toLowerCase())
)

/**
 * Infers item_type from a category string.
 * Returns null when the category is ambiguous (e.g. 'supply', 'other').
 *
 * @example
 *   inferItemType('spirits')    // 'beverage'
 *   inferItemType('proteins')   // 'food'
 *   inferItemType('napkins')    // 'paper'
 *   inferItemType('supply')     // null
 */
export function inferItemType(category: string): 'food' | 'beverage' | 'paper' | null {
  const cat = category.toLowerCase().trim()
  if (FOOD_CAT_SET.has(cat)) return 'food'
  if (PAPER_CAT_SET.has(cat)) return 'paper'
  if (BEVERAGE_CAT_SET.has(cat)) return 'beverage'
  return null
}
