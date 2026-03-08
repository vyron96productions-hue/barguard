import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import {
  calculateExpectedUsage,
  calculateActualUsage,
  calculateVariance,
  type RecipeMap,
  type SaleRecord,
} from '@/lib/calculations'
import { convertToOz } from '@/lib/conversions'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { period_start, period_end } = body

  if (!period_start || !period_end) {
    return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
  }

  // Load sales transactions for period
  const { data: salesData, error: salesError } = await supabase
    .from('sales_transactions')
    .select('menu_item_id, quantity_sold')
    .eq('business_id', DEMO_BUSINESS_ID)
    .gte('sale_date', period_start)
    .lte('sale_date', period_end)
    .not('menu_item_id', 'is', null)

  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 })

  // Load all recipes
  const { data: recipesData, error: recipesError } = await supabase
    .from('menu_item_recipes')
    .select('menu_item_id, inventory_item_id, quantity, unit')

  if (recipesError) return NextResponse.json({ error: recipesError.message }, { status: 500 })

  // Load inventory items (for units)
  const { data: inventoryItems } = await supabase
    .from('inventory_items')
    .select('id, name, unit')
    .eq('business_id', DEMO_BUSINESS_ID)

  // Build recipe map
  const recipeMap: RecipeMap = {}
  for (const r of recipesData ?? []) {
    if (!recipeMap[r.menu_item_id]) recipeMap[r.menu_item_id] = []
    recipeMap[r.menu_item_id].push({ inventory_item_id: r.inventory_item_id, quantity: r.quantity, unit: r.unit })
  }

  const itemUnits: Record<string, string> = {}
  for (const item of inventoryItems ?? []) itemUnits[item.id] = item.unit

  const sales: SaleRecord[] = (salesData ?? []).map((s) => ({
    menu_item_id: s.menu_item_id,
    quantity_sold: s.quantity_sold,
  }))

  const expectedUsage = calculateExpectedUsage(sales, recipeMap, itemUnits)

  // Get beginning inventory (earliest count <= period_start)
  // Get ending inventory (latest count <= period_end)
  const { data: beginCounts } = await supabase
    .from('inventory_counts')
    .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
    .eq('business_id', DEMO_BUSINESS_ID)
    .lte('count_date', period_start)
    .not('inventory_item_id', 'is', null)
    .order('count_date', { ascending: false })

  const { data: endCounts } = await supabase
    .from('inventory_counts')
    .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
    .eq('business_id', DEMO_BUSINESS_ID)
    .lte('count_date', period_end)
    .not('inventory_item_id', 'is', null)
    .order('count_date', { ascending: false })

  // Latest count per item for beginning and ending
  const beginByItem: Record<string, { qty: number; unit: string | null }> = {}
  for (const c of beginCounts ?? []) {
    if (!beginByItem[c.inventory_item_id]) {
      beginByItem[c.inventory_item_id] = { qty: c.quantity_on_hand, unit: c.unit_type }
    }
  }

  const endByItem: Record<string, { qty: number; unit: string | null }> = {}
  for (const c of endCounts ?? []) {
    if (!endByItem[c.inventory_item_id]) {
      endByItem[c.inventory_item_id] = { qty: c.quantity_on_hand, unit: c.unit_type }
    }
  }

  // Get purchases in period
  const { data: purchasesData } = await supabase
    .from('purchases')
    .select('inventory_item_id, quantity_purchased, unit_type')
    .eq('business_id', DEMO_BUSINESS_ID)
    .gte('purchase_date', period_start)
    .lte('purchase_date', period_end)
    .not('inventory_item_id', 'is', null)

  const purchasedByItem: Record<string, number> = {}
  for (const p of purchasesData ?? []) {
    const unit = p.unit_type ?? itemUnits[p.inventory_item_id] ?? 'oz'
    const oz = convertToOz(p.quantity_purchased, unit)
    purchasedByItem[p.inventory_item_id] = (purchasedByItem[p.inventory_item_id] ?? 0) + oz
  }

  // All item IDs involved
  const allItemIds = new Set([
    ...Object.keys(expectedUsage),
    ...Object.keys(beginByItem),
    ...Object.keys(endByItem),
    ...Object.keys(purchasedByItem),
  ])

  const summaries = []
  for (const itemId of allItemIds) {
    const unit = itemUnits[itemId] ?? 'oz'
    const beginRaw = beginByItem[itemId]
    const endRaw = endByItem[itemId]
    const beginOz = beginRaw ? convertToOz(beginRaw.qty, beginRaw.unit ?? unit) : 0
    const endOz = endRaw ? convertToOz(endRaw.qty, endRaw.unit ?? unit) : 0
    const purchasedOz = purchasedByItem[itemId] ?? 0
    const expected = expectedUsage[itemId] ?? 0

    const actual = calculateActualUsage(beginOz, purchasedOz, endOz)
    const { variance, variancePercent, status } = calculateVariance(actual, expected)

    summaries.push({
      business_id: DEMO_BUSINESS_ID,
      inventory_item_id: itemId,
      period_start,
      period_end,
      beginning_inventory: beginOz,
      ending_inventory: endOz,
      purchased: purchasedOz,
      actual_usage: actual,
      expected_usage: expected,
      variance,
      variance_percent: variancePercent,
      status,
    })
  }

  // Upsert summaries
  const { error: upsertError } = await supabase
    .from('inventory_usage_summaries')
    .upsert(summaries, { onConflict: 'business_id,inventory_item_id,period_start,period_end' })

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ calculated: summaries.length, period_start, period_end })
}
