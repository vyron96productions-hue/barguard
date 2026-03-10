import { convertToOz, isLiquidUnit } from './conversions'

export interface DrinkIngredient {
  inventory_item_id: string | null
  quantity_oz: number
}

export interface DrinkCostResult {
  estimated_cost: number    // sum of costed ingredients
  has_full_cost: boolean    // true if ALL ingredients have cost data
  missing_count: number     // how many ingredients lack cost data
}

/** Cost info per inventory item — supports both liquid (cost_per_oz) and food (cost_per_unit) */
export interface ItemCostInfo {
  cost_per_oz:   number | null
  cost_per_unit: number | null
}

/**
 * Calculate item cost from menu_item_recipes rows.
 * - Liquid units (oz/ml/bottle/keg/etc.): cost_per_oz × convertToOz(qty, unit)
 * - Food/non-liquid units (each/lb/portion/etc.): cost_per_unit × qty
 * Falls back across strategies so both drinks and food work correctly.
 */
export function calculateDrinkCostFromRecipe(
  recipes: Array<{ inventory_item_id: string; quantity: number; unit: string }>,
  costById: Record<string, ItemCostInfo>,
): DrinkCostResult {
  let estimated_cost = 0
  let missing_count = 0

  for (const r of recipes) {
    const info = costById[r.inventory_item_id]
    if (!info) { missing_count++; continue }

    const liquid = isLiquidUnit(r.unit)

    if (liquid && info.cost_per_oz != null) {
      // Beverage path: convert recipe qty to oz, multiply by cost_per_oz
      estimated_cost += convertToOz(r.quantity, r.unit) * info.cost_per_oz
    } else if (info.cost_per_unit != null) {
      // Food path: recipe qty × cost_per_unit (units assumed to match)
      estimated_cost += r.quantity * info.cost_per_unit
    } else if (!liquid && info.cost_per_oz != null) {
      // Fallback: food item that only has cost_per_oz set
      estimated_cost += r.quantity * info.cost_per_oz
    } else {
      missing_count++
    }
  }

  return {
    estimated_cost,
    has_full_cost: missing_count === 0 && recipes.length > 0,
    missing_count,
  }
}

export function profitMarginPct(revenue: number, cost: number): number | null {
  if (revenue <= 0) return null
  return ((revenue - cost) / revenue) * 100
}
