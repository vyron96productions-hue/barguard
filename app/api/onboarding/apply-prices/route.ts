import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { resolveInventoryItemId } from '@/lib/aliases'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'onboarding/apply-prices'

interface PriceEntry {
  raw_item_name: string
  unit_cost: number          // price as the user entered it (may be per-case for food lb items)
  units_per_package?: number | null // lbs per case / units per pack — used to convert to per-unit cost
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const body = await req.json()
    const entries: PriceEntry[] = body.entries

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
    }

    // Resolve inventory item IDs from raw names / aliases
    const resolved: { itemId: string; cost: number }[] = []
    const unresolved: string[] = []

    for (const entry of entries) {
      const itemId = await resolveInventoryItemId(entry.raw_item_name, supabase, businessId)
      if (!itemId) {
        unresolved.push(entry.raw_item_name)
        continue
      }

      // Fetch item to check if it's food+lb so we can divide by lbs_per_case
      const { data: item } = await supabase
        .from('inventory_items')
        .select('item_type, unit, pack_size')
        .eq('id', itemId)
        .eq('business_id', businessId)
        .single()

      let costPerUnit = entry.unit_cost
      const upp = entry.units_per_package ?? (item?.pack_size ?? null)

      // Food + lb + known lbs-per-case: user entered cost-per-case → divide to get cost-per-lb
      if (item?.item_type === 'food' && item?.unit === 'lb' && upp != null && upp > 1) {
        costPerUnit = entry.unit_cost / upp
      }

      resolved.push({ itemId, cost: costPerUnit })
    }

    // Batch update — one update per item
    let updated = 0
    for (const { itemId, cost } of resolved) {
      const { error } = await supabase
        .from('inventory_items')
        .update({ cost_per_unit: cost })
        .eq('id', itemId)
        .eq('business_id', businessId)

      if (!error) updated++
    }

    logger.info(ROUTE, 'Prices applied', { businessId, updated, unresolved: unresolved.length })

    return NextResponse.json({ updated, unresolved })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
