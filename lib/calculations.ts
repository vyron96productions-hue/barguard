import { convertToOz } from './conversions'
import type { VarianceStatus } from '@/types'

export interface RecipeIngredient {
  inventory_item_id: string
  quantity: number
  unit: string
}

export interface SaleRecord {
  menu_item_id: string
  quantity_sold: number
}

export interface RecipeMap {
  [menu_item_id: string]: RecipeIngredient[]
}

export interface InventoryItemUnit {
  [inventory_item_id: string]: string
}

/**
 * Calculate expected usage (oz) for each inventory item
 * based on sales quantities and recipes.
 */
export function calculateExpectedUsage(
  sales: SaleRecord[],
  recipeMap: RecipeMap,
  itemUnits: InventoryItemUnit
): Record<string, number> {
  const expected: Record<string, number> = {}

  for (const sale of sales) {
    const ingredients = recipeMap[sale.menu_item_id]
    if (!ingredients) continue

    for (const ingredient of ingredients) {
      const usageOz = convertToOz(ingredient.quantity, ingredient.unit) * sale.quantity_sold
      expected[ingredient.inventory_item_id] = (expected[ingredient.inventory_item_id] ?? 0) + usageOz
    }
  }

  return expected
}

/**
 * Calculate actual usage (oz) from inventory movement.
 * actual_usage = beginning_inventory + purchased - ending_inventory
 */
export function calculateActualUsage(
  beginningOz: number,
  purchasedOz: number,
  endingOz: number
): number {
  return beginningOz + purchasedOz - endingOz
}

/**
 * Calculate variance (actual - expected).
 * Positive variance = more was used than expected (loss/over-pour).
 * Negative variance = less was used than expected.
 */
export function calculateVariance(
  actualUsage: number,
  expectedUsage: number
): { variance: number; variancePercent: number | null; status: VarianceStatus } {
  const variance = actualUsage - expectedUsage

  let variancePercent: number | null = null
  if (expectedUsage > 0) {
    variancePercent = ((actualUsage - expectedUsage) / expectedUsage) * 100
  }

  const absPercent = variancePercent !== null ? Math.abs(variancePercent) : 0
  let status: VarianceStatus = 'normal'
  if (absPercent >= 20) status = 'critical'
  else if (absPercent >= 10) status = 'warning'

  return { variance, variancePercent, status }
}
