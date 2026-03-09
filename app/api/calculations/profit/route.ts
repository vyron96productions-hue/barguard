import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { calculateDrinkCostFromRecipe, profitMarginPct } from '@/lib/drink-costing'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { period_start, period_end, shift_start, shift_end, shift_label } = body

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    const isShiftMode = !!(shift_start && shift_end)

    let query = supabase
      .from('sales_transactions')
      .select('menu_item_id, quantity_sold, gross_sales')
      .eq('business_id', businessId)
      .not('menu_item_id', 'is', null)

    if (isShiftMode) {
      query = query.or(
        `and(sale_timestamp.gte.${shift_start},sale_timestamp.lte.${shift_end}),` +
        `and(sale_timestamp.is.null,sale_date.gte.${period_start},sale_date.lte.${period_end})`
      )
    } else {
      query = query.gte('sale_date', period_start).lte('sale_date', period_end)
    }

    const { data: sales, error: salesErr } = await query
    if (salesErr) return NextResponse.json({ error: salesErr.message }, { status: 500 })
    if (!sales || sales.length === 0) return NextResponse.json([])

    const byItem = new Map<string, { qty: number; revenue: number }>()
    for (const row of sales) {
      const id = row.menu_item_id as string
      const existing = byItem.get(id) ?? { qty: 0, revenue: 0 }
      existing.qty += row.quantity_sold ?? 0
      existing.revenue += row.gross_sales ?? 0
      byItem.set(id, existing)
    }

    const menuItemIds = [...byItem.keys()]

    const [recipesRes, costsRes] = await Promise.all([
      supabase
        .from('menu_item_recipes')
        .select('menu_item_id, inventory_item_id, quantity, unit')
        .in('menu_item_id', menuItemIds),
      supabase
        .from('inventory_items')
        .select('id, cost_per_oz')
        .eq('business_id', businessId)
        .not('cost_per_oz', 'is', null),
    ])

    if (recipesRes.error) return NextResponse.json({ error: recipesRes.error.message }, { status: 500 })
    if (costsRes.error) return NextResponse.json({ error: costsRes.error.message }, { status: 500 })

    const costPerOzById: Record<string, number> = {}
    for (const item of costsRes.data ?? []) {
      if (item.cost_per_oz != null) costPerOzById[item.id] = item.cost_per_oz
    }

    const recipesByItem = new Map<string, Array<{ inventory_item_id: string; quantity: number; unit: string }>>()
    for (const r of recipesRes.data ?? []) {
      const list = recipesByItem.get(r.menu_item_id) ?? []
      list.push({ inventory_item_id: r.inventory_item_id, quantity: r.quantity, unit: r.unit })
      recipesByItem.set(r.menu_item_id, list)
    }

    const results: Array<{
      menu_item_id: string
      quantity_sold: number
      gross_revenue: number
      estimated_cost: number | null
      estimated_profit: number | null
      profit_margin_pct: number | null
      has_full_cost: boolean
    }> = []

    for (const [menuItemId, { qty, revenue }] of byItem.entries()) {
      const recipes = recipesByItem.get(menuItemId) ?? []

      if (recipes.length === 0) {
        results.push({ menu_item_id: menuItemId, quantity_sold: qty, gross_revenue: revenue, estimated_cost: null, estimated_profit: null, profit_margin_pct: null, has_full_cost: false })
        continue
      }

      const { estimated_cost: costPerDrink, has_full_cost } = calculateDrinkCostFromRecipe(recipes, costPerOzById)
      const totalCost = costPerDrink * qty
      const profit = revenue - totalCost
      const margin = profitMarginPct(revenue, totalCost)

      results.push({ menu_item_id: menuItemId, quantity_sold: qty, gross_revenue: revenue, estimated_cost: totalCost, estimated_profit: profit, profit_margin_pct: margin, has_full_cost })
    }

    const shiftLabelVal = shift_label ?? null
    const upsertRows = results.map((r) => ({
      business_id: businessId,
      menu_item_id: r.menu_item_id,
      period_start,
      period_end,
      shift_label: shiftLabelVal,
      quantity_sold: r.quantity_sold,
      gross_revenue: r.gross_revenue,
      estimated_cost: r.estimated_cost,
      estimated_profit: r.estimated_profit,
      profit_margin_pct: r.profit_margin_pct,
      has_full_cost: r.has_full_cost,
      calculated_at: new Date().toISOString(),
    }))

    await supabase
      .from('drink_profit_summaries')
      .upsert(upsertRows, { onConflict: 'business_id,menu_item_id,period_start,period_end,shift_label' })

    return NextResponse.json(results)
  } catch (e) { return authErrorResponse(e) }
}
