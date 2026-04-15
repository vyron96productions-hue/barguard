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
  /** Gross sales revenue for this line, if available */
  gross_sales?: number | null
  /** Guest / cover count for this transaction, if available from POS */
  guest_count?: number | null
  /** Raw modifier names from POS (e.g. ["No Bacon", "Extra Shot"]) */
  modifiers?: string[] | null
}

export interface ModifierRule {
  action: 'add' | 'remove' | 'multiply' | 'ignore' | 'swap'
  /** Inventory item to add/remove (for add/remove actions) */
  inventory_item_id?: string | null
  /** Quantity to add or remove per unit sold */
  qty_delta?: number | null
  /** Unit for qty_delta — oz, ml, each, slice, piece, etc. Defaults to oz */
  qty_unit?: string | null
  /** Multiplier applied to all base recipe ingredients (for multiply action, e.g. 2 = double) */
  multiply_factor?: number | null
  // ── Swap action fields ────────────────────────────────────────────────────
  /** Specific inventory item to remove (swap: specific-item mode) */
  swap_remove_item_id?: string | null
  /** Category to remove from the item's recipe (swap: by-category mode) */
  swap_remove_category?: string | null
  /** Qty to remove — null in category mode means "use recipe qty for that ingredient" */
  swap_remove_qty?: number | null
  swap_remove_unit?: string | null
  /** Inventory item to add in its place */
  swap_add_item_id?: string | null
  swap_add_qty?: number | null
  swap_add_unit?: string | null
}

/** Keyed by lowercase-trimmed modifier name */
export type ModifierRuleMap = Record<string, ModifierRule>

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
/**
 * Maps inventory_item_id → category (lowercase).
 * Needed for swap rules that remove by category rather than specific item.
 */
export type InventoryItemCategories = Record<string, string | null>

export function calculateExpectedUsage(
  sales: SaleRecord[],
  recipeMap: RecipeMap,
  itemUnits: InventoryItemUnit,
  modifierRules?: ModifierRuleMap,
  inventoryCategories?: InventoryItemCategories
): Record<string, number> {
  const expected: Record<string, number> = {}

  for (const sale of sales) {
    const ingredients = recipeMap[sale.menu_item_id]
    if (!ingredients) continue

    // Base recipe usage
    for (const ingredient of ingredients) {
      const usageOz = convertToOz(ingredient.quantity, ingredient.unit) * sale.quantity_sold
      expected[ingredient.inventory_item_id] = (expected[ingredient.inventory_item_id] ?? 0) + usageOz
    }

    // Apply modifier adjustments — only when rules are loaded and sale has modifiers
    if (modifierRules && sale.modifiers?.length) {
      for (const modName of sale.modifiers) {
        const rule = modifierRules[modName.toLowerCase().trim()]
        if (!rule || rule.action === 'ignore') continue

        if (rule.action === 'remove' && rule.inventory_item_id && rule.qty_delta) {
          const deltaOz = convertToOz(rule.qty_delta, rule.qty_unit ?? 'oz') * sale.quantity_sold
          expected[rule.inventory_item_id] = Math.max(0, (expected[rule.inventory_item_id] ?? 0) - deltaOz)
        }

        if (rule.action === 'add' && rule.inventory_item_id && rule.qty_delta) {
          const deltaOz = convertToOz(rule.qty_delta, rule.qty_unit ?? 'oz') * sale.quantity_sold
          expected[rule.inventory_item_id] = (expected[rule.inventory_item_id] ?? 0) + deltaOz
        }

        if (rule.action === 'multiply' && rule.multiply_factor && rule.multiply_factor !== 1) {
          // Multiply all base recipe ingredients by the factor (e.g. "double" = 2x)
          // Add the extra usage on top of what was already counted above
          const extraFactor = rule.multiply_factor - 1
          for (const ingredient of ingredients) {
            const extraOz = convertToOz(ingredient.quantity, ingredient.unit) * extraFactor * sale.quantity_sold
            expected[ingredient.inventory_item_id] = (expected[ingredient.inventory_item_id] ?? 0) + extraOz
          }
        }

        if (rule.action === 'swap') {
          // ── Remove phase ─────────────────────────────────────────────────
          if (rule.swap_remove_item_id) {
            // Specific item: always remove this exact ingredient
            if (rule.swap_remove_qty) {
              const removeOz = convertToOz(rule.swap_remove_qty, rule.swap_remove_unit ?? 'oz') * sale.quantity_sold
              expected[rule.swap_remove_item_id] = Math.max(0, (expected[rule.swap_remove_item_id] ?? 0) - removeOz)
            }
          } else if (rule.swap_remove_category && inventoryCategories) {
            // Category mode: remove whichever recipe ingredient(s) belong to this category.
            // Uses the recipe qty for that ingredient unless swap_remove_qty overrides it.
            const targetCat = rule.swap_remove_category.toLowerCase().trim()
            for (const ingredient of ingredients) {
              const cat = (inventoryCategories[ingredient.inventory_item_id] ?? '').toLowerCase().trim()
              if (cat === targetCat) {
                const removeQtyOz = rule.swap_remove_qty
                  ? convertToOz(rule.swap_remove_qty, rule.swap_remove_unit ?? 'oz')
                  : convertToOz(ingredient.quantity, ingredient.unit)  // use recipe qty
                const removeTotal = removeQtyOz * sale.quantity_sold
                expected[ingredient.inventory_item_id] = Math.max(0, (expected[ingredient.inventory_item_id] ?? 0) - removeTotal)
              }
            }
          }

          // ── Add phase ─────────────────────────────────────────────────────
          if (rule.swap_add_item_id && rule.swap_add_qty) {
            const addOz = convertToOz(rule.swap_add_qty, rule.swap_add_unit ?? 'oz') * sale.quantity_sold
            expected[rule.swap_add_item_id] = (expected[rule.swap_add_item_id] ?? 0) + addOz
          }
        }
      }
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
 * Sum gross_sales across all sale records.
 * Returns 0 when no records have gross_sales populated.
 */
export function aggregateRevenue(sales: SaleRecord[]): number {
  return sales.reduce((sum, s) => sum + (s.gross_sales ?? 0), 0)
}

/**
 * Estimate guest / cover count from sale records.
 *
 * Priority:
 *  1. Exact: sum of guest_count when POS provides per-transaction cover counts.
 *  2. None:  returns null when no guest_count data is present.
 *
 * Callers should label the result clearly:
 *  - source 'exact'  → display as-is
 *  - source 'none'   → omit or show "—"
 */
export interface GuestCountResult {
  count: number | null
  /** How the count was derived — display this clearly in the UI */
  source: 'exact' | 'none'
}

export function estimateGuestCount(sales: SaleRecord[]): GuestCountResult {
  const total = sales.reduce((sum, s) => sum + (s.guest_count ?? 0), 0)
  if (total > 0) return { count: total, source: 'exact' }
  return { count: null, source: 'none' }
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
