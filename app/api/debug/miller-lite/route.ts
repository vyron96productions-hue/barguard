import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { convertToOz, convertFromOz } from '@/lib/conversions'
import { earliestCountDate } from '@/lib/inventory-calc'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [{ data: items }, { data: counts }, { data: recipes }] = await Promise.all([
      supabase.from('inventory_items').select('id, name, unit').eq('business_id', businessId),
      supabase.from('inventory_counts').select('inventory_item_id, quantity_on_hand, count_date')
        .eq('business_id', businessId).order('count_date', { ascending: false }),
      supabase.from('menu_item_recipes').select('menu_item_id, inventory_item_id, quantity, unit'),
    ])

    const ml = (items ?? []).find((i) => i.name === 'Miller Lite')
    if (!ml) return NextResponse.json({ error: 'Miller Lite inventory item not found' })

    const lc = (counts ?? []).find((c) => c.inventory_item_id === ml.id)
    const mlRecipes = (recipes ?? []).filter((r) => r.inventory_item_id === ml.id)
    const earliest = earliestCountDate(counts ?? [])

    const { data: sales } = await supabase
      .from('sales_transactions')
      .select('menu_item_id, quantity_sold, sale_date, raw_item_name')
      .eq('business_id', businessId)
      .gte('sale_date', earliest ?? '2026-01-01')
      .not('menu_item_id', 'is', null)
      .limit(100000)

    // Find sales for each recipe menu_item_id
    const recipeMenuIds = mlRecipes.map((r) => r.menu_item_id)
    const mlSales = (sales ?? []).filter((s) => recipeMenuIds.includes(s.menu_item_id ?? ''))
    const mlSalesAfterCount = mlSales.filter((s) => lc ? s.sale_date >= lc.count_date : false)

    // Compute deductions
    let totalDeductionOz = 0
    const deductionBreakdown: Record<string, { sales: number; oz_per_sale: number; total_oz: number }> = {}
    for (const r of mlRecipes) {
      const recipeSales = mlSalesAfterCount.filter((s) => s.menu_item_id === r.menu_item_id)
      const totalQty = recipeSales.reduce((sum, s) => sum + (s.quantity_sold ?? 0), 0)
      const ozPerSale = convertToOz(r.quantity, r.unit)
      const totalOz = totalQty * ozPerSale
      totalDeductionOz += totalOz
      deductionBreakdown[r.menu_item_id] = { sales: totalQty, oz_per_sale: ozPerSale, total_oz: totalOz }
    }

    const baseOz = lc ? convertToOz(lc.quantity_on_hand, ml.unit) : 0
    const estimatedOz = Math.max(0, baseOz - totalDeductionOz)
    const estimatedQty = convertFromOz(estimatedOz, ml.unit)

    return NextResponse.json({
      business_id: businessId,
      inventory_item: { id: ml.id, name: ml.name, unit: ml.unit },
      last_count: lc ?? null,
      earliest_count_date: earliest,
      total_sales_fetched: (sales ?? []).length,
      recipes: mlRecipes.map((r) => ({ menu_item_id: r.menu_item_id, quantity: r.quantity, unit: r.unit })),
      recipe_menu_ids: recipeMenuIds,
      ml_sales_total: mlSales.length,
      ml_sales_after_count: mlSalesAfterCount.length,
      deduction_breakdown: deductionBreakdown,
      base_oz: baseOz,
      total_deduction_oz: totalDeductionOz,
      estimated_oz: estimatedOz,
      estimated_qty: estimatedQty,
    })
  } catch (e) { return authErrorResponse(e) }
}
