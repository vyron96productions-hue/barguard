import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const [{ data: items }, { data: counts }] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('id, name, unit, category')
      .eq('business_id', DEMO_BUSINESS_ID)
      .order('category', { nullsFirst: false })
      .order('name'),
    supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, count_date, unit_type')
      .eq('business_id', DEMO_BUSINESS_ID)
      .order('count_date', { ascending: false }),
  ])

  // Latest count per item
  const latestCountMap = new Map<string, { quantity_on_hand: number; count_date: string; unit_type: string | null }>()
  for (const c of counts ?? []) {
    if (c.inventory_item_id && !latestCountMap.has(c.inventory_item_id)) {
      latestCountMap.set(c.inventory_item_id, {
        quantity_on_hand: c.quantity_on_hand,
        count_date: c.count_date,
        unit_type: c.unit_type,
      })
    }
  }

  const result = (items ?? []).map((item) => {
    const count = latestCountMap.get(item.id) ?? null
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      category: item.category,
      quantity_on_hand: count?.quantity_on_hand ?? null,
      count_date: count?.count_date ?? null,
    }
  })

  return NextResponse.json(result)
}
