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

    // 2. All physical counts — ordered desc so we can find the latest per item
    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
      .eq('business_id', businessId)
      .not('inventory_item_id', 'is', null)
      .order('count_date', { ascending: false })

    // Latest count per item
    const latestCount: Record<string, { qty: number; unit: string; date: string }> = {}
    for (const c of counts ?? []) {
      if (!latestCount[c.inventory_item_id]) {
        latestCount[c.inventory_item_id] = {
          qty:  c.quantity_on_hand,
          unit: c.unit_type ?? 'oz',
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
      const oz = convertToOz(p.quantity_purchased, p.unit_type ?? 'oz')
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

    // 5. Recipes for menu items that appear in sales
    const menuItemIds = [...new Set(sales.map((s) => s.menu_item_id as string))]
    const { data: recipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')
      .in('menu_item_id', menuItemIds)

    const recipeMap: Record<string, Array<{ inventory_item_id: string; quantity: number; unit: string }>> = {}
    for (const r of recipes ?? []) {
      if (!recipeMap[r.menu_item_id]) recipeMap[r.menu_item_id] = []
      recipeMap[r.menu_item_id].push(r)
    }

    // 6. Deductions per inventory item (oz), filtered to after each item's last count
    const deductionsOz: Record<string, number> = {}
    for (const sale of sales) {
      const itemRecipes = recipeMap[sale.menu_item_id as string] ?? []
      for (const recipe of itemRecipes) {
        const lc = latestCount[recipe.inventory_item_id]
        if (!lc || sale.sale_date < lc.date) continue
        const oz = convertToOz(recipe.quantity * sale.quantity_sold, recipe.unit)
        deductionsOz[recipe.inventory_item_id] = (deductionsOz[recipe.inventory_item_id] ?? 0) + oz
      }
    }

    // 7. Build result — only items with a physical count baseline
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

    return NextResponse.json(result)
  } catch (e) { return authErrorResponse(e) }
}
