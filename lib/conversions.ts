// Unit conversion helpers
// Liquid units normalize to ounces. Food units (each, lb, portion, etc.) pass through as-is.

export const UNIT_TO_OZ: Record<string, number> = {
  oz: 1,
  ml: 0.033814,
  cl: 0.33814,
  l: 33.814,
  liter: 33.814,
  litre: 33.814,
  bottle: 25.36,    // 750ml standard bottle
  '750ml': 25.36,
  '1L': 33.814,
  '1l': 33.814,
  '1.75L': 59.1745,
  '1.75l': 59.1745,
  keg: 1984,        // 15.5 gallon keg
  halfkeg: 1984,
  quarterkeg: 992,
  sixthkeg: 661,
  pint: 16,
  can: 12,          // 12oz standard can
  case: 304.32,     // 12 x 750ml
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

/** All units available for inventory items and recipe mappings */
export const ALL_UNITS = [
  // Liquid / beverage
  'oz', 'ml', 'cl', 'l', 'bottle', 'can', 'keg', 'halfkeg', 'quarterkeg', 'sixthkeg', 'pint', 'case',
  // Food / kitchen
  'each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g',
  'bag', 'tray', 'box', 'flat', 'cup', 'tbsp', 'tsp', 'jar', 'packet',
]
