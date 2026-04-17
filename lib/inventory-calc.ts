/**
 * lib/inventory-calc.ts
 * Single source of truth for expected-on-hand stock calculations.
 *
 * Pure function — no database calls. Callers fetch the data; this module
 * computes. This separation makes the logic testable in isolation and prevents
 * the same formula from diverging across routes.
 *
 * Formula
 * -------
 *   estimated_qty = last_count + purchases_since − sales_deductions
 *
 * All arithmetic is performed in oz. convertToOz() and convertFromOz() pass
 * quantities through unchanged for non-liquid units (each, lb, portion, etc.),
 * so this single path handles every unit type correctly — no separate
 * "native unit" branch needed.
 *
 * Unit source
 * -----------
 * We ALWAYS use item.unit as the canonical unit for count quantities, never
 * count.unit_type. The unit_type column on inventory_counts is unreliable:
 * imports (AI scan, CSV, purchase upload) frequently store the wrong unit.
 * Changing an item's unit immediately fixes all calculations without any DB
 * cleanup.
 *
 * Boundary condition
 * ------------------
 * Both purchases and sales use >= lastCountDate (inclusive). A count taken at
 * the start of day should include that day's deliveries/sales.
 *
 * Known divergence from legacy routes
 * ------------------------------------
 * The old stock-levels and reorder-alerts routes had a bug in their non-oz path:
 * food items with no UNIT_TO_OZ factor (e.g. 'each') had their purchase qty
 * omitted from the estimate (used count - usage without + purchases).
 * This library fixes that. Shadow-comparison logs will show the delta for
 * affected items until those routes are fully migrated.
 */

import { convertToOz, convertFromOz } from '@/lib/conversions'

// ---------------------------------------------------------------------------
// Input types — intentionally loose (optional fields) so every caller can
// pass its Supabase row shapes directly without mapping.
// ---------------------------------------------------------------------------

export interface CalcItem {
  id:           string
  name:         string
  unit:         string
  category?:    string | null
  item_type?:   string | null
  pack_size?:   number | null
  package_type?: string | null
  reorder_level?: number | null
}

export interface CalcCount {
  inventory_item_id: string | null
  quantity_on_hand:  number
  count_date:        string
  unit_type?:        string | null   // ignored — item.unit is authoritative
}

export interface CalcPurchase {
  inventory_item_id: string | null
  quantity_purchased: number
  unit_type?:         string | null
  purchase_date:      string
}

export interface CalcSale {
  menu_item_id:   string | null
  quantity_sold:  number | null
  sale_date:      string
}

export interface CalcRecipe {
  menu_item_id:       string
  inventory_item_id:  string
  quantity:           number
  unit:               string
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface ItemCalcResult {
  /** Latest physical count — null if item has never been counted */
  last_count_qty:    number | null
  last_count_date:   string | null

  /** Oz added via purchases since last count (0 if no count) */
  purchases_since_oz: number
  /** Oz consumed via sales × recipes since last count (0 if no recipes) */
  deductions_since_oz: number

  /**
   * Estimated on-hand in the item's native unit.
   * null when there is no physical count baseline.
   *
   * NOTE: even without recipes, estimated_qty = count + purchases (no deductions).
   * This is still a useful floor estimate — it just won't go down from sales.
   */
  estimated_qty:    number | null
  /** Same value in oz */
  estimated_qty_oz: number | null

  /** True if at least one recipe drives sales-based deductions for this item */
  has_recipe: boolean
  /** True if there is a count baseline (estimate can be computed) */
  has_estimate: boolean
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * calculateExpectedOnHand
 *
 * Accepts pre-fetched rows from Supabase and returns a Map of
 * inventory_item_id → ItemCalcResult for every item in `items`.
 *
 * @param items     All inventory items for the business
 * @param counts    All inventory_counts, ordered date DESC (first-seen = latest per item)
 * @param purchases All purchases since the earliest count baseline
 * @param sales     All sales_transactions since the earliest count baseline
 * @param recipes   All menu_item_recipes (fetched WITHOUT .in() filter to avoid URL limit)
 */
export function calculateExpectedOnHand(
  items:     CalcItem[],
  counts:    CalcCount[],
  purchases: CalcPurchase[],
  sales:     CalcSale[],
  recipes:   CalcRecipe[],
): Map<string, ItemCalcResult> {

  // ── 1. Item unit lookup ──────────────────────────────────────────────────
  // item.unit is the single source of truth. Never use count.unit_type.
  const itemUnit = new Map<string, string>()
  for (const item of items) itemUnit.set(item.id, item.unit)

  // ── 2. Latest count per item ─────────────────────────────────────────────
  // counts must arrive ordered date DESC so the first-wins strategy gives latest.
  const latestCount = new Map<string, { qty: number; date: string }>()
  for (const c of counts) {
    if (!c.inventory_item_id) continue
    if (!latestCount.has(c.inventory_item_id)) {
      latestCount.set(c.inventory_item_id, {
        qty:  c.quantity_on_hand,
        date: c.count_date,
      })
    }
  }

  // ── 3. Recipe index: menu_item_id → [{inventory_item_id, oz_per_sale}] ───
  const recipesByMenu = new Map<string, Array<{ inventory_item_id: string; oz_per_sale: number }>>()
  const itemsWithRecipes = new Set<string>()

  for (const r of recipes) {
    if (!recipesByMenu.has(r.menu_item_id)) recipesByMenu.set(r.menu_item_id, [])
    recipesByMenu.get(r.menu_item_id)!.push({
      inventory_item_id: r.inventory_item_id,
      // convertToOz passes through unchanged for non-liquid units —
      // so oz_per_sale is in "oz or native unit" depending on the recipe unit.
      oz_per_sale: convertToOz(r.quantity, r.unit),
    })
    itemsWithRecipes.add(r.inventory_item_id)
  }

  // ── 4. Purchases by item: inventory_item_id → [{oz, date}] ───────────────
  const purchasesByItem = new Map<string, Array<{ oz: number; date: string }>>()
  for (const p of purchases) {
    if (!p.inventory_item_id) continue
    const unit = p.unit_type ?? itemUnit.get(p.inventory_item_id) ?? 'oz'
    const oz   = convertToOz(p.quantity_purchased, unit)
    if (!purchasesByItem.has(p.inventory_item_id)) purchasesByItem.set(p.inventory_item_id, [])
    purchasesByItem.get(p.inventory_item_id)!.push({ oz, date: p.purchase_date })
  }

  // ── 5. Deductions by item: inventory_item_id → [{oz, date}] ─────────────
  // Forward pass: iterate sales → look up recipes → distribute to inv items.
  // This is O(total_sales × avg_recipes_per_menu_item), same as the per-route loops.
  const deductionsByItem = new Map<string, Array<{ oz: number; date: string }>>()
  for (const s of sales) {
    if (!s.menu_item_id || !s.quantity_sold) continue
    const recipeList = recipesByMenu.get(s.menu_item_id)
    if (!recipeList) continue
    for (const recipe of recipeList) {
      if (!deductionsByItem.has(recipe.inventory_item_id)) {
        deductionsByItem.set(recipe.inventory_item_id, [])
      }
      deductionsByItem.get(recipe.inventory_item_id)!.push({
        oz:   s.quantity_sold * recipe.oz_per_sale,
        date: s.sale_date,
      })
    }
  }

  // ── 6. Compute result per item ───────────────────────────────────────────
  const result = new Map<string, ItemCalcResult>()

  for (const item of items) {
    const lc = latestCount.get(item.id) ?? null

    if (!lc) {
      // No count baseline — cannot estimate
      result.set(item.id, {
        last_count_qty:     null,
        last_count_date:    null,
        purchases_since_oz: 0,
        deductions_since_oz: 0,
        estimated_qty:      null,
        estimated_qty_oz:   null,
        has_recipe:         itemsWithRecipes.has(item.id),
        has_estimate:       false,
      })
      continue
    }

    const unit   = itemUnit.get(item.id) ?? item.unit
    const baseOz = convertToOz(lc.qty, unit)

    // Purchases on or after count date (>= inclusive)
    const purchasesOz = (purchasesByItem.get(item.id) ?? [])
      .filter((p) => p.date >= lc.date)
      .reduce((sum, p) => sum + p.oz, 0)

    // Sales deductions on or after count date (>= inclusive)
    const deductionsOz = (deductionsByItem.get(item.id) ?? [])
      .filter((d) => d.date >= lc.date)
      .reduce((sum, d) => sum + d.oz, 0)

    const estimatedOz  = Math.max(0, baseOz + purchasesOz - deductionsOz)
    const estimatedQty = Math.max(0, convertFromOz(estimatedOz, unit))

    result.set(item.id, {
      last_count_qty:     lc.qty,
      last_count_date:    lc.date,
      purchases_since_oz: purchasesOz,
      deductions_since_oz: deductionsOz,
      estimated_qty:      estimatedQty,
      estimated_qty_oz:   estimatedOz,
      has_recipe:         itemsWithRecipes.has(item.id),
      has_estimate:       true,
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers used by multiple routes
// ---------------------------------------------------------------------------

/**
 * Returns the earliest count_date across all items that have a count,
 * or null if no counts exist. Routes use this to scope their sales/purchase
 * queries (no point fetching data older than the oldest baseline).
 */
export function earliestCountDate(
  counts: Pick<CalcCount, 'inventory_item_id' | 'count_date'>[],
): string | null {
  let earliest: string | null = null
  for (const c of counts) {
    if (!c.inventory_item_id) continue
    if (!earliest || c.count_date < earliest) earliest = c.count_date
  }
  return earliest
}
