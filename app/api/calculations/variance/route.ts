import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import {
  calculateExpectedUsage,
  calculateActualUsage,
  calculateVariance,
  aggregateRevenue,
  estimateGuestCount,
  type RecipeMap,
  type SaleRecord,
  type ModifierRuleMap,
  type InventoryItemCategories,
} from '@/lib/calculations'
import { convertToOz } from '@/lib/conversions'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'manager')
    const { supabase, businessId } = ctx
    const body = await req.json()
    const { period_start, period_end, shift_start, shift_end } = body
    // Normalize shift_label: treat empty string as null so it maps to the
    // same COALESCE('') bucket as null in the D-002 uniqueness index.
    const shift_label: string | null = body.shift_label || null

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    // Validate format and ordering. String comparison is correct for YYYY-MM-DD (lexicographic = chronological).
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
    if (!ISO_DATE.test(period_start) || !ISO_DATE.test(period_end)) {
      return NextResponse.json({ error: 'period_start and period_end must be YYYY-MM-DD' }, { status: 400 })
    }
    if (period_start > period_end) {
      return NextResponse.json({ error: 'period_start must be on or before period_end' }, { status: 400 })
    }

    const isShiftMode = !!(shift_start && shift_end)

    let salesData: Array<{
      menu_item_id: string
      quantity_sold: number
      gross_sales: number | null
      guest_count: number | null
      modifiers?: string[] | null
    }> | null = null
    let salesError: { message: string } | null = null

    if (isShiftMode) {
      const { data, error } = await supabase.rpc('get_sales_in_shift', {
        p_business_id: businessId,
        p_shift_start: shift_start,
        p_shift_end:   shift_end,
        p_date_start:  period_start,
        p_date_end:    period_end,
      })
      salesData  = data
      salesError = error
    } else {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('menu_item_id, quantity_sold, gross_sales, guest_count, modifiers')
        .eq('business_id', businessId)
        .gte('sale_date', period_start)
        .lte('sale_date', period_end)
        .not('menu_item_id', 'is', null)
      salesData  = data
      salesError = error
    }

    if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 })

    const { data: recipesData, error: recipesError } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')

    if (recipesError) return NextResponse.json({ error: recipesError.message }, { status: 500 })

    const { data: inventoryItems } = await supabase
      .from('inventory_items')
      .select('id, name, unit, category')
      .eq('business_id', businessId)

    const recipeMap: RecipeMap = {}
    for (const r of recipesData ?? []) {
      if (!recipeMap[r.menu_item_id]) recipeMap[r.menu_item_id] = []
      recipeMap[r.menu_item_id].push({ inventory_item_id: r.inventory_item_id, quantity: r.quantity, unit: r.unit })
    }

    const itemUnits: Record<string, string> = {}
    const inventoryCategories: InventoryItemCategories = {}
    for (const item of inventoryItems ?? []) {
      itemUnits[item.id] = item.unit
      inventoryCategories[item.id] = (item as any).category ?? null
    }

    const sales: SaleRecord[] = (salesData ?? []).map((s) => ({
      menu_item_id: s.menu_item_id,
      quantity_sold: s.quantity_sold,
      gross_sales: s.gross_sales,
      guest_count: s.guest_count,
      modifiers: Array.isArray(s.modifiers) ? s.modifiers : null,
    }))

    // Load modifier rules — only for non-shift mode (shift RPC doesn't return modifiers column)
    let modifierRuleMap: ModifierRuleMap | undefined
    if (!isShiftMode) {
      const { data: modRulesData } = await supabase
        .from('modifier_rules')
        .select('modifier_name, action, inventory_item_id, qty_delta, qty_unit, multiply_factor, swap_remove_item_id, swap_remove_category, swap_remove_qty, swap_remove_unit, swap_add_item_id, swap_add_qty, swap_add_unit')
        .eq('business_id', businessId)
      if (modRulesData?.length) {
        modifierRuleMap = {}
        for (const r of modRulesData as any[]) {
          modifierRuleMap[r.modifier_name.toLowerCase().trim()] = {
            action: r.action,
            inventory_item_id: r.inventory_item_id,
            qty_delta: r.qty_delta,
            qty_unit: r.qty_unit,
            multiply_factor: r.multiply_factor,
            swap_remove_item_id: r.swap_remove_item_id,
            swap_remove_category: r.swap_remove_category,
            swap_remove_qty: r.swap_remove_qty,
            swap_remove_unit: r.swap_remove_unit,
            swap_add_item_id: r.swap_add_item_id,
            swap_add_qty: r.swap_add_qty,
            swap_add_unit: r.swap_add_unit,
          }
        }
      }
    }

    const expectedUsage  = calculateExpectedUsage(sales, recipeMap, itemUnits, modifierRuleMap, inventoryCategories)
    const totalRevenue   = aggregateRevenue(sales)
    const guestEstimate  = estimateGuestCount(sales)

    const { data: beginCounts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
      .eq('business_id', businessId)
      .lte('count_date', period_start)
      .not('inventory_item_id', 'is', null)
      .order('count_date', { ascending: false })

    const { data: endCounts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, unit_type, count_date')
      .eq('business_id', businessId)
      .lte('count_date', period_end)
      .not('inventory_item_id', 'is', null)
      .order('count_date', { ascending: false })

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

    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('inventory_item_id, quantity_purchased, unit_type')
      .eq('business_id', businessId)
      .gte('purchase_date', period_start)
      .lte('purchase_date', period_end)
      .not('inventory_item_id', 'is', null)

    const purchasedByItem: Record<string, number> = {}
    for (const p of purchasesData ?? []) {
      const unit = p.unit_type ?? itemUnits[p.inventory_item_id] ?? 'oz'
      purchasedByItem[p.inventory_item_id] =
        (purchasedByItem[p.inventory_item_id] ?? 0) + convertToOz(p.quantity_purchased, unit)
    }

    const allItemIds = new Set([
      ...Object.keys(expectedUsage),
      ...Object.keys(beginByItem),
      ...Object.keys(endByItem),
      ...Object.keys(purchasedByItem),
    ])

    const summaries = []
    for (const itemId of allItemIds) {
      const unit     = itemUnits[itemId] ?? 'oz'
      const beginRaw = beginByItem[itemId]
      const endRaw   = endByItem[itemId]
      const beginOz  = beginRaw ? convertToOz(beginRaw.qty, beginRaw.unit ?? unit) : 0
      const endOz    = endRaw   ? convertToOz(endRaw.qty,   endRaw.unit   ?? unit) : 0
      const purchasedOz = purchasedByItem[itemId] ?? 0
      const expected    = expectedUsage[itemId] ?? 0

      const actual = calculateActualUsage(beginOz, purchasedOz, endOz)
      const { variance, variancePercent, status } = calculateVariance(actual, expected)

      summaries.push({
        business_id:        businessId,
        inventory_item_id:  itemId,
        period_start,
        period_end,
        beginning_inventory: beginOz,
        ending_inventory:    endOz,
        purchased:           purchasedOz,
        actual_usage:        actual,
        expected_usage:      expected,
        variance,
        variance_percent:    variancePercent,
        status,
        shift_start:   shift_start   ?? null,
        shift_end:     shift_end     ?? null,
        shift_label:   shift_label   ?? null,
        total_revenue: totalRevenue  > 0 ? totalRevenue : null,
        total_covers:  guestEstimate.count,
      })
    }

    // Scoped replacement: delete only the rows for this exact summary set
    // (same business, same period, same shift bucket). Rows from other periods
    // or other shift labels are left intact so concurrent analyses don't
    // overwrite each other's results.
    const baseDelete = supabase
      .from('inventory_usage_summaries')
      .delete()
      .eq('business_id', businessId)
      .eq('period_start', period_start)
      .eq('period_end', period_end)

    const { error: deleteError } = await (
      shift_label != null
        ? baseDelete.eq('shift_label', shift_label)
        : baseDelete.is('shift_label', null)
    )

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    const { error: insertError } = await supabase
      .from('inventory_usage_summaries')
      .insert(summaries)

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({
      calculated: summaries.length,
      period_start,
      period_end,
      shift_label: shift_label ?? null,
      total_revenue: totalRevenue > 0 ? totalRevenue : null,
      total_covers: guestEstimate.count,
      guest_count_source: guestEstimate.source,
    })
  } catch (e) { return authErrorResponse(e) }
}
