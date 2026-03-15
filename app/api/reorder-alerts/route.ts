import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { convertToOz, UNIT_TO_OZ } from '@/lib/conversions'

export interface ReorderAlert {
  id: string
  name: string
  unit: string
  category: string | null
  reorder_level: number
  current_qty: number | null  // null = never counted
  count_date: string | null
}

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    // Fetch items that have a reorder_level set
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, name, unit, category, reorder_level')
      .eq('business_id', businessId)
      .not('reorder_level', 'is', null)
      .order('name')

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
    if (!items || items.length === 0) return NextResponse.json([])

    const itemIds = items.map((i) => i.id)

    // Fetch latest count per item
    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, count_date')
      .eq('business_id', businessId)
      .in('inventory_item_id', itemIds)
      .order('count_date', { ascending: false })

    const latestCount = new Map<string, { quantity_on_hand: number; count_date: string }>()
    for (const c of counts ?? []) {
      if (c.inventory_item_id && !latestCount.has(c.inventory_item_id)) {
        latestCount.set(c.inventory_item_id, {
          quantity_on_hand: c.quantity_on_hand,
          count_date: c.count_date,
        })
      }
    }

    // Get recipes for these items
    const { data: recipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')
      .in('inventory_item_id', itemIds)

    const recipesByInvItem: Record<string, Array<{ menu_item_id: string; oz_per_sale: number }>> = {}
    for (const r of recipes ?? []) {
      if (!recipesByInvItem[r.inventory_item_id]) recipesByInvItem[r.inventory_item_id] = []
      recipesByInvItem[r.inventory_item_id].push({
        menu_item_id: r.menu_item_id,
        oz_per_sale: convertToOz(r.quantity, r.unit),
      })
    }

    // Scope sales/purchase queries from earliest count date
    const allCountDates = Array.from(latestCount.values()).map((c) => c.count_date).sort()
    const earliestDate = allCountDates[0] ?? null

    const salesMap: Record<string, Record<string, number>> = {}
    const purchasesMap: Record<string, Array<{ quantity_oz: number; purchase_date: string }>> = {}

    if (earliestDate) {
      const itemUnitMap: Record<string, string> = {}
      for (const i of items) itemUnitMap[i.id] = i.unit

      const [{ data: salesData }, { data: purchasesData }] = await Promise.all([
        supabase
          .from('sales_transactions')
          .select('menu_item_id, quantity_sold, sale_date')
          .eq('business_id', businessId)
          .gte('sale_date', earliestDate)
          .not('menu_item_id', 'is', null),
        supabase
          .from('purchases')
          .select('inventory_item_id, quantity_purchased, unit_type, purchase_date')
          .eq('business_id', businessId)
          .gte('purchase_date', earliestDate)
          .in('inventory_item_id', itemIds)
          .not('inventory_item_id', 'is', null),
      ])

      for (const s of salesData ?? []) {
        if (!s.menu_item_id) continue
        if (!salesMap[s.menu_item_id]) salesMap[s.menu_item_id] = {}
        salesMap[s.menu_item_id][s.sale_date] = (salesMap[s.menu_item_id][s.sale_date] ?? 0) + (s.quantity_sold ?? 0)
      }

      for (const p of purchasesData ?? []) {
        if (!purchasesMap[p.inventory_item_id]) purchasesMap[p.inventory_item_id] = []
        const unit = p.unit_type ?? itemUnitMap[p.inventory_item_id] ?? 'oz'
        purchasesMap[p.inventory_item_id].push({
          quantity_oz: convertToOz(p.quantity_purchased, unit),
          purchase_date: p.purchase_date,
        })
      }
    }

    // Compute effective qty using same estimation as stock-levels page
    function getEffectiveQty(
      item: (typeof items)[0],
      count: { quantity_on_hand: number; count_date: string },
    ): number {
      if (!recipesByInvItem[item.id]?.length) return count.quantity_on_hand

      const lastCountOz = convertToOz(count.quantity_on_hand, item.unit)

      const purchasedOz = (purchasesMap[item.id] ?? [])
        .filter((p) => p.purchase_date > count.count_date)
        .reduce((s, p) => s + p.quantity_oz, 0)

      let usedOz = 0
      for (const recipe of recipesByInvItem[item.id]) {
        const datesMap = salesMap[recipe.menu_item_id]
        if (!datesMap) continue
        for (const [date, qty] of Object.entries(datesMap)) {
          if (date > count.count_date) usedOz += qty * recipe.oz_per_sale
        }
      }

      const estimatedOz = lastCountOz + purchasedOz - usedOz
      const unitFactor = UNIT_TO_OZ[item.unit.toLowerCase().trim()] ?? null

      if (unitFactor) {
        return Math.max(0, estimatedOz / unitFactor)
      }

      // Food / non-liquid: compute usage in native units
      let nativeUsed = 0
      for (const recipe of recipesByInvItem[item.id]) {
        const datesMap = salesMap[recipe.menu_item_id]
        if (!datesMap) continue
        for (const [date, qty] of Object.entries(datesMap)) {
          if (date > count.count_date) nativeUsed += qty * recipe.oz_per_sale
        }
      }
      return Math.max(0, count.quantity_on_hand - nativeUsed)
    }

    // Return items where effective qty ≤ reorder_level (or never counted)
    const alerts: ReorderAlert[] = items
      .filter((item) => {
        const count = latestCount.get(item.id)
        if (!count) return true // never counted → flag it
        return getEffectiveQty(item, count) <= item.reorder_level
      })
      .map((item) => {
        const count = latestCount.get(item.id)
        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          reorder_level: item.reorder_level,
          current_qty: count ? getEffectiveQty(item, count) : null,
          count_date: count?.count_date ?? null,
        }
      })

    return NextResponse.json(alerts)
  } catch (e) { return authErrorResponse(e) }
}
