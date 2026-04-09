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
  bottle: 25.36,    // 750ml standard spirit/wine bottle
  '750ml': 25.36,
  '1L': 33.814,
  '1l': 33.814,
  '1.75L': 59.1745,
  '1.75l': 59.1745,
  keg: 1984,        // 15.5 gal half-barrel = 1984oz total
  quarterkeg: 992,  // 7.75 gal quarter-barrel = 992oz total
  sixthkeg: 661,    // 5.17 gal sixth-barrel = 661oz total
  pint: 16,
  can: 12,          // standard 12oz can
  beer_bottle: 12,  // standard 12oz beer bottle
  case: 288,        // 24 × 12oz = 288oz total per case
}

// Food / kitchen units that don't convert to oz — tracked in their native unit
export const FOOD_UNITS = new Set([
  'each', 'piece', 'portion', 'serving', 'slice',
  'lb', 'lbs', 'pound', 'kg', 'g', 'gram',
  'bag', 'tray', 'box', 'flat',
  'cup', 'tbsp', 'tsp',
  'jar', 'packet',
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

export function isSupportedUnit(unit: string): boolean {
  const n = unit.toLowerCase().trim()
  return n in UNIT_TO_OZ || FOOD_UNITS.has(n)
}

/** Units used for counting inventory (shown in UI dropdowns) */
export const INVENTORY_BEVERAGE_UNITS = [
  'bottle', '1L', '1.75L', 'can', 'beer_bottle', 'pint', 'case', 'keg', 'quarterkeg', 'sixthkeg',
]

/** Units used for counting food/kitchen inventory (shown in UI dropdowns) */
export const INVENTORY_FOOD_UNITS = [
  'each', 'portion', 'serving', 'slice', 'piece',
  'lb', 'kg', 'g', 'oz',
  'cup', 'tbsp', 'tsp',
  'bag', 'box', 'tray', 'flat', 'jar', 'packet',
]

/** Human-friendly labels for inventory unit values */
export const UNIT_LABELS: Record<string, string> = {
  // Beverage
  bottle:      'Bottle (750ml)',
  '1L':        'Bottle (1L)',
  '1.75L':     'Handle (1.75L)',
  can:         'Beer Can (12oz)',
  beer_bottle: 'Beer Bottle (12oz)',
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
}

/** Returns the friendly label for a unit, falling back to the raw value */
export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit
}

/** Short display label for use in tables/badges next to numbers */
export const SHORT_UNIT_LABELS: Record<string, string> = {
  bottle:      'btl',
  '1L':        '1L btl',
  '1.75L':     '1.75L',
  can:         'can',
  beer_bottle: 'beer btl',
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
  'bottle', 'beer_bottle', 'can', 'case', 'keg', 'quarterkeg', 'sixthkeg', '1L', '1.75L',
  'each', 'piece', 'portion', 'serving', 'slice', 'bag', 'tray', 'box', 'flat', 'jar', 'packet',
])

/** Format a quantity for display. Whole-item units (bottles, cans, etc.) show as integers. */
export function formatQty(qty: number, unit: string): string {
  if (WHOLE_UNITS.has(unit)) return String(Math.round(qty))
  const rounded = Number(qty.toFixed(1))
  return String(rounded)
}

/** All units (inventory + recipe pour units) */
export const ALL_UNITS = [
  // Beverage — counting units
  'bottle', '1L', '1.75L', 'can', 'pint', 'case', 'keg', 'quarterkeg', 'sixthkeg',
  // Beverage — pour / recipe units (not used for inventory counting)
  'oz', 'ml', 'cl', 'l',
  // Food / kitchen
  'each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g',
  'bag', 'tray', 'box', 'flat', 'cup', 'tbsp', 'tsp', 'jar', 'packet',
]
