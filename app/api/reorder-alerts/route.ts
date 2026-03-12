import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

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

    // Fetch latest count per item
    const itemIds = items.map((i) => i.id)
    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, count_date')
      .eq('business_id', businessId)
      .in('inventory_item_id', itemIds)
      .order('count_date', { ascending: false })

    // Build map: item_id → latest count
    const latestCount = new Map<string, { quantity_on_hand: number; count_date: string }>()
    for (const c of counts ?? []) {
      if (c.inventory_item_id && !latestCount.has(c.inventory_item_id)) {
        latestCount.set(c.inventory_item_id, {
          quantity_on_hand: c.quantity_on_hand,
          count_date: c.count_date,
        })
      }
    }

    // Return items where current qty ≤ reorder_level (or never counted)
    const alerts: ReorderAlert[] = items
      .filter((item) => {
        const count = latestCount.get(item.id)
        if (!count) return true // never counted → flag it
        return count.quantity_on_hand <= item.reorder_level
      })
      .map((item) => {
        const count = latestCount.get(item.id)
        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          reorder_level: item.reorder_level,
          current_qty: count?.quantity_on_hand ?? null,
          count_date: count?.count_date ?? null,
        }
      })

    return NextResponse.json(alerts)
  } catch (e) { return authErrorResponse(e) }
}
