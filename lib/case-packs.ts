/**
 * Case-pack detection — single source of truth for "should this item show
 * cases + loose units instead of a single quantity input?"
 *
 * A case-pack item is one where the unit tracks individual units (lbs, oz,
 * each, gallons, etc.) but the item is purchased/stored in multi-unit packs
 * (cases). The pack_size column stores how many native units are in one case.
 *
 * Used by: stock page count mode, inventory items edit panel, set-stock form.
 */

export interface CasePackItem {
  item_type?: string | null
  unit?: string | null
  pack_size?: number | null
}

/** Units that support case+loose display for food items */
const FOOD_CASE_UNITS = new Set(['lb', 'oz', 'each', 'gallon', 'quart'])

/** Units that support case+loose display for beverage items (sodas, mixers, kegs) */
const BEVERAGE_CASE_UNITS = new Set(['gallon', 'quart', 'liter'])

/**
 * Returns true if this item should be shown / entered as "X cases + Y loose".
 * Requires pack_size > 1 — items with no pack size or pack_size = 1 are plain quantities.
 */
export function isCasePack(item: CasePackItem): boolean {
  if ((item.pack_size ?? 0) <= 1) return false
  const type = item.item_type
  const unit = item.unit ?? ''
  return (
    (type === 'food' && FOOD_CASE_UNITS.has(unit)) ||
    (type === 'beverage' && BEVERAGE_CASE_UNITS.has(unit)) ||
    type === 'paper'
  )
}
