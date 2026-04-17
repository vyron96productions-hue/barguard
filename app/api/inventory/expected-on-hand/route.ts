import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { convertToOz, convertFromOz } from '@/lib/conversions'

export interface ExpectedOnHandItem {
  id:                string
  name:              string
  unit:              string
  expected_qty:      number   // in item's native unit
  expected_qty_oz:   number
  last_count_qty:    number | null
  last_count_date:   string | null
  purchases_since_oz: number
  deductions_since_oz: number
}

/**
 * Returns expected on-hand quantity for every inventory item that has a
 * physical count on record.
 *
 * expected = last_physical_count + purchases_since − (sales × recipe_qty)
 *
 * Items with no physical count are omitted — there is no baseline to anchor
 * the calculation to.
 */
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    // 1. All inventory items
    const { data: items, error: itemsErr } = await supabase
      .from('inventory_items')
      .select('id, name, unit')
      .eq('business_id', businessId)

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    if (!items?.length) return NextResponse.json([])

    // Item unit lookup — authoritative source of truth for unit type
    const itemUnit: Record<string, string> = {}
    for (const item of items ?? []) itemUnit[item.id] = item.unit

    // 2. All physical counts — ordered desc so we can find the latest per item
    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
      .eq('business_id', businessId)
      .not('inventory_item_id', 'is', null)
      .order('count_date', { ascending: false })

    // Latest count per item.
    // ALWAYS use item.unit — never trust count.unit_type.
    // Physical counts are done in the item's native unit. The unit_type column
    // on inventory_counts is unreliable: imports (onboarding scan, CSV, purchase
    // upload) frequently store the wrong unit (e.g. 'each', 'box') because the
    // AI or CSV mapped it incorrectly. Using item.unit as the single source of
    // truth means changing the item's unit immediately fixes the calculation
    // without any manual DB cleanup.
    const latestCount: Record<string, { qty: number; unit: string; date: string }> = {}
    for (const c of counts ?? []) {
      if (!latestCount[c.inventory_item_id]) {
        latestCount[c.inventory_item_id] = {
          qty:  c.quantity_on_hand,
          unit: itemUnit[c.inventory_item_id] ?? 'oz',
          date: c.count_date,
        }
      }
    }

    // Earliest baseline date we need sales/purchases from
    const baselineDates = Object.values(latestCount).map((c) => c.date)
    if (baselineDates.length === 0) return NextResponse.json([])
    const earliestBaseline = baselineDates.sort()[0]

    // 3. Purchases since earliest baseline
    const { data: purchases } = await supabase
      .from('purchases')
      .select('inventory_item_id, quantity_purchased, unit_type, purchase_date')
      .eq('business_id', businessId)
      .not('inventory_item_id', 'is', null)
      .gte('purchase_date', earliestBaseline)

    // Sum purchases per item (oz), filtered to after each item's last count
    const purchasesOz: Record<string, number> = {}
    for (const p of purchases ?? []) {
      const lc = latestCount[p.inventory_item_id]
      if (!lc || p.purchase_date < lc.date) continue
      const oz = convertToOz(p.quantity_purchased, p.unit_type ?? itemUnit[p.inventory_item_id] ?? 'oz')
      purchasesOz[p.inventory_item_id] = (purchasesOz[p.inventory_item_id] ?? 0) + oz
    }

    // 4. Sales transactions since earliest baseline (matched to menu items)
    const { data: sales } = await supabase
      .from('sales_transactions')
      .select('menu_item_id, quantity_sold, sale_date')
      .eq('business_id', businessId)
      .not('menu_item_id', 'is', null)
      .gte('sale_date', earliestBaseline)

    if (!sales?.length) {
      // No sales data — expected = count + purchases only
      return NextResponse.json(
        items
          .filter((item) => latestCount[item.id])
          .map((item): ExpectedOnHandItem => {
            const lc = latestCount[item.id]!
            const baseOz = convertToOz(lc.qty, lc.unit)
            const addOz  = purchasesOz[item.id] ?? 0
            const expOz  = baseOz + addOz
            return {
              id: item.id, name: item.name, unit: item.unit,
              expected_qty: Math.max(0, convertFromOz(expOz, item.unit)),
              expected_qty_oz: Math.max(0, expOz),
              last_count_qty: lc.qty, last_count_date: lc.date,
              purchases_since_oz: addOz, deductions_since_oz: 0,
            }
          })
      )
    }

    // 5. Recipes for all menu items — do NOT filter with .in() here.
    // menu_item_recipes has no business_id column; RLS scopes it via the FK
    // to menu_items. A large .in(menuItemIds) list hits PostgREST's URL limit
    // and silently returns nothing, making deductions appear as zero.
    const { data: recipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')

    const recipeMap: Record<string, Array<{ inventory_item_id: string; quantity: number; unit: string }>> = {}
    for (const r of recipes ?? []) {
      if (!recipeMap[r.menu_item_id]) recipeMap[r.menu_item_id] = []
      recipeMap[r.menu_item_id].push(r)
    }

    // 6. Deductions per inventory item (oz), filtered to after each item's last count.
    // For items with no count, accumulate all deductions in the query window —
    // this lets the "COUNT THIS" badge appear on food items that have never been
    // physically counted but are actively being sold.
    const deductionsOz: Record<string, number> = {}
    for (const sale of sales) {
      const itemRecipes = recipeMap[sale.menu_item_id as string] ?? []
      for (const recipe of itemRecipes) {
        const lc = latestCount[recipe.inventory_item_id]
        // If there IS a count, only count sales after it. If no count, include all sales.
        if (lc && sale.sale_date < lc.date) continue
        const oz = convertToOz(recipe.quantity * sale.quantity_sold, recipe.unit)
        deductionsOz[recipe.inventory_item_id] = (deductionsOz[recipe.inventory_item_id] ?? 0) + oz
      }
    }

    // 7. Build result — items with a physical count baseline get full expected-qty math.
    const result: ExpectedOnHandItem[] = items
      .filter((item) => latestCount[item.id])
      .map((item) => {
        const lc     = latestCount[item.id]!
        const baseOz = convertToOz(lc.qty, lc.unit)
        const addOz  = purchasesOz[item.id]   ?? 0
        const subOz  = deductionsOz[item.id]  ?? 0
        const expOz  = baseOz + addOz - subOz

        return {
          id:   item.id,
          name: item.name,
          unit: item.unit,
          expected_qty:     Math.max(0, convertFromOz(expOz, item.unit)),
          expected_qty_oz:  Math.max(0, expOz),
          last_count_qty:   lc.qty,
          last_count_date:  lc.date,
          purchases_since_oz: addOz,
          deductions_since_oz: subOz,
        }
      })

    // Also include items with NO count but with active deductions.
    // These get deductions_since_oz > 0 so the "COUNT THIS" badge appears,
    // but expected_qty is 0 (no baseline to anchor a real estimate).
    const uncounted: ExpectedOnHandItem[] = items
      .filter((item) => !latestCount[item.id] && (deductionsOz[item.id] ?? 0) > 0)
      .map((item) => ({
        id:   item.id,
        name: item.name,
        unit: item.unit,
        expected_qty:        0,
        expected_qty_oz:     0,
        last_count_qty:      null,
        last_count_date:     null,
        purchases_since_oz:  0,
        deductions_since_oz: deductionsOz[item.id]!,
      }))

    return NextResponse.json([...result, ...uncounted])
  } catch (e) { return authErrorResponse(e) }
}
