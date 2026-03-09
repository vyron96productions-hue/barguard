import { convertToOz } from './conversions'

export interface DrinkIngredient {
  inventory_item_id: string | null
  quantity_oz: number
}

export interface DrinkCostResult {
  estimated_cost: number    // sum of costed ingredients
  has_full_cost: boolean    // true if ALL ingredients have cost_per_oz
  missing_count: number     // how many ingredients lack cost data
}

/**
 * Calculate the estimated cost of a drink given its ingredients and a
 * map of cost_per_oz values keyed by inventory_item_id.
 */
export function calculateDrinkCost(
  ingredients: DrinkIngredient[],
  costPerOzById: Record<string, number>,
): DrinkCostResult {
  let estimated_cost = 0
  let missing_count = 0

  for (const ing of ingredients) {
    if (!ing.inventory_item_id) { missing_count++; continue }
    const costPerOz = costPerOzById[ing.inventory_item_id]
    if (costPerOz == null) { missing_count++; continue }
    estimated_cost += ing.quantity_oz * costPerOz
  }

  return {
    estimated_cost,
    has_full_cost: missing_count === 0 && ingredients.length > 0,
    missing_count,
  }
}

/**
 * Calculate drink cost from menu_item_recipes rows (which store quantity + unit).
 * Normalizes to oz first, then applies cost_per_oz.
 */
export function calculateDrinkCostFromRecipe(
  recipes: Array<{ inventory_item_id: string; quantity: number; unit: string }>,
  costPerOzById: Record<string, number>,
): DrinkCostResult {
  const ingredients: DrinkIngredient[] = recipes.map((r) => ({
    inventory_item_id: r.inventory_item_id,
    quantity_oz: convertToOz(r.quantity, r.unit),
  }))
  return calculateDrinkCost(ingredients, costPerOzById)
}

export function profitMarginPct(revenue: number, cost: number): number | null {
  if (revenue <= 0) return null
  return ((revenue - cost) / revenue) * 100
}
