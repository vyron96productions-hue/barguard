// Unit conversion helpers
// All conversions normalize to ounces as the base unit for liquor

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
  case: 304.32,     // 12 x 750ml
}

export function convertToOz(quantity: number, unit: string): number {
  const normalized = unit.toLowerCase().trim()
  const factor = UNIT_TO_OZ[normalized]
  if (!factor) return quantity // assume already in oz if unit unknown
  return quantity * factor
}

export function isSupportedUnit(unit: string): boolean {
  return unit.toLowerCase().trim() in UNIT_TO_OZ
}
