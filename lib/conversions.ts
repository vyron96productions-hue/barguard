// Unit conversion helpers
// Liquid units normalize to ounces. Food units (each, lb, portion, etc.) pass through as-is.

/**
 * Total fluid ounces per inventory unit.
 * Used for cost-per-oz calculations and quantity conversions.
 *
 * These are TOTAL OZ values — not serving counts.
 * For number of servings per package, see PACKAGE_TYPE_SIZES in lib/beer-packaging.ts.
 * Do NOT mix these two tables — they measure different things.
 */
export const UNIT_TO_OZ: Record<string, number> = {
  oz: 1,
  ml: 0.033814,
  cl: 0.33814,
  l: 33.814,
  liter: 33.814,
  litre: 33.814,
  bottle:      25.36,  // 750ml standard spirit bottle
  wine_bottle: 25.36,  // 750ml wine bottle (same volume, different pour size — 5oz glass vs 1.5oz shot)
  '750ml':     25.36,
  '1L': 33.814,
  '1l': 33.814,
  '1.75L': 59.1745,
  '1.75l': 59.1745,
  keg: 1984,        // 15.5 gal half-barrel = 1984oz total
  quarterkeg: 992,  // 7.75 gal quarter-barrel = 992oz total
  sixthkeg: 661,    // 5.17 gal sixth-barrel = 661oz total
  pint: 16,
  can: 12,               // standard 12oz can (beer, soda, mixer, energy drink)
  can_16oz: 16,          // 16oz can (Red Bull 16oz, tall boy energy drinks, etc.)
  beer_bottle: 12,       // standard 12oz beer bottle
  beer_bottle_16oz: 16,  // 16oz pint-size beer bottle ("tall boy" bottle)
  case: 288,        // 24 × 12oz = 288oz total per case
}

// Food / kitchen units that don't convert to oz — tracked in their native unit
export const FOOD_UNITS = new Set([
  'each', 'piece', 'portion', 'serving', 'slice',
  'lb', 'lbs', 'pound', 'kg', 'g', 'gram',
  'bag', 'tray', 'box', 'flat',
  'cup', 'tbsp', 'tsp',
  'jar', 'packet',
  // Paper / supply units
  'pack', 'sleeve', 'roll',
])

export function isLiquidUnit(unit: string): boolean {
  return unit.toLowerCase().trim() in UNIT_TO_OZ
}

export function convertToOz(quantity: number, unit: string): number {
  const normalized = unit.toLowerCase().trim()
  const factor = UNIT_TO_OZ[normalized]
  if (!factor) return quantity // food/unknown units pass through unchanged
  return quantity * factor
}

/** Reverse of convertToOz — converts oz back to the item's native unit. */
export function convertFromOz(oz: number, unit: string): number {
  const factor = UNIT_TO_OZ[unit.toLowerCase().trim()]
  if (!factor) return oz // food/unknown units — no conversion
  return oz / factor
}

export function isSupportedUnit(unit: string): boolean {
  const n = unit.toLowerCase().trim()
  return n in UNIT_TO_OZ || FOOD_UNITS.has(n)
}

/** Units used for counting inventory (shown in UI dropdowns) */
export const INVENTORY_BEVERAGE_UNITS = [
  'bottle', 'wine_bottle', '1L', '1.75L', 'can', 'can_16oz', 'beer_bottle', 'beer_bottle_16oz', 'pint', 'case', 'keg', 'quarterkeg', 'sixthkeg',
]

/** Units used for counting food/kitchen inventory (shown in UI dropdowns) */
export const INVENTORY_FOOD_UNITS = [
  'each', 'portion', 'serving', 'slice', 'piece',
  'lb', 'kg', 'g', 'oz',
  'cup', 'tbsp', 'tsp',
  'bag', 'box', 'tray', 'flat', 'jar', 'packet',
]

/** Units used for counting paper goods / supplies inventory (shown in UI dropdowns) */
export const INVENTORY_PAPER_UNITS = [
  'each', 'pack', 'sleeve', 'roll', 'box', 'bag',
]

/** Human-friendly labels for inventory unit values */
export const UNIT_LABELS: Record<string, string> = {
  // Beverage
  bottle:      'Spirit Bottle (750ml)',
  wine_bottle: 'Wine Bottle (750ml)',
  '1L':        'Bottle (1L)',
  '1.75L':     'Handle (1.75L)',
  can:              'Can (12oz)',
  can_16oz:         'Can (16oz)',
  beer_bottle:      'Beer Bottle (12oz)',
  beer_bottle_16oz: 'Beer Bottle (16oz)',
  pint:        'Pint (16oz)',
  case:        'Case (24 × 12oz)',
  keg:         'Keg (½ bbl · 1984oz)',
  quarterkeg:  'Quarter Keg',
  sixthkeg:    'Sixth Keg',
  // Food / kitchen
  each:        'Each',
  portion:     'Portion',
  serving:     'Serving',
  slice:       'Slice',
  piece:       'Piece',
  lb:          'lb (pound)',
  kg:          'kg',
  g:           'g (gram)',
  oz:          'oz (weight)',
  cup:         'Cup',
  tbsp:        'Tablespoon',
  tsp:         'Teaspoon',
  bag:         'Bag',
  box:         'Box',
  tray:        'Tray',
  flat:        'Flat',
  jar:         'Jar',
  packet:      'Packet',
  // Paper / supply
  pack:        'Pack',
  sleeve:      'Sleeve',
  roll:        'Roll',
}

/** Returns the friendly label for a unit, falling back to the raw value */
export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit
}

/** Short display label for use in tables/badges next to numbers */
export const SHORT_UNIT_LABELS: Record<string, string> = {
  bottle:      'spirit btl',
  wine_bottle: 'wine btl',
  '1L':        '1L btl',
  '1.75L':     '1.75L',
  can:         'can 12oz',
  can_16oz:    'can 16oz',
  beer_bottle:      'beer btl',
  beer_bottle_16oz: 'beer btl 16oz',
  pint:        'pint',
  case:        'case',
  keg:         'keg',
  quarterkeg:  '¼ keg',
  sixthkeg:    '⅙ keg',
}

export function shortUnitLabel(unit: string): string {
  return SHORT_UNIT_LABELS[unit] ?? unit
}

/**
 * Returns cost per oz for an inventory item.
 * Uses cost_per_unit ÷ oz_per_unit when available, otherwise falls back to a
 * generic $0.85/oz estimate so the UI always has something to show.
 */
export function itemCostPerOz(costPerUnit: number | null | undefined, unit: string): number {
  const FALLBACK = 0.85
  if (!costPerUnit || costPerUnit <= 0) return FALLBACK
  const oz = convertToOz(1, unit)
  if (!oz || oz <= 0) return FALLBACK
  return costPerUnit / oz
}

// Units that are always whole items — never display as decimals
const WHOLE_UNITS = new Set([
  'bottle', 'wine_bottle', 'beer_bottle', 'beer_bottle_16oz', 'can', 'can_16oz', 'case', '1L', '1.75L',
  'each', 'piece', 'portion', 'serving', 'slice', 'bag', 'tray', 'box', 'flat', 'jar', 'packet',
  'pack', 'sleeve', 'roll',
])
// Kegs intentionally excluded — partial keg counts (e.g. 0.75) are meaningful and must not be rounded.

const KEG_UNITS = new Set(['keg', 'quarterkeg', 'sixthkeg'])

/** Format a quantity for display. Whole-item units (bottles, cans, etc.) show as integers. Kegs show up to 2 decimal places. */
export function formatQty(qty: number, unit: string): string {
  if (WHOLE_UNITS.has(unit)) return String(Math.round(qty))
  if (KEG_UNITS.has(unit)) {
    // Show up to 2 decimals, strip trailing zeros
    return parseFloat(qty.toFixed(2)).toString()
  }
  const rounded = Number(qty.toFixed(1))
  return String(rounded)
}

/** All units (inventory + recipe pour units) */
export const ALL_UNITS = [
  // Beverage — counting units
  'bottle', 'wine_bottle', '1L', '1.75L', 'can', 'can_16oz', 'beer_bottle', 'beer_bottle_16oz', 'pint', 'case', 'keg', 'quarterkeg', 'sixthkeg',
  // Beverage — pour / recipe units (not used for inventory counting)
  'oz', 'ml', 'cl', 'l',
  // Food / kitchen
  'each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g',
  'bag', 'tray', 'box', 'flat', 'cup', 'tbsp', 'tsp', 'jar', 'packet',
  // Paper / supply
  'pack', 'sleeve', 'roll',
]
