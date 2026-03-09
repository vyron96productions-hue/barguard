import { NextRequest, NextResponse } from 'next/server'
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

// Manual stock adjustment — updates item fields and optionally records a new quantity
export async function PATCH(req: NextRequest) {
  const { id, name, unit, category, quantity_on_hand } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Update inventory item fields
  const itemUpdates: Record<string, string | null> = {}
  if (name !== undefined) itemUpdates.name = name.trim()
  if (unit !== undefined) itemUpdates.unit = unit
  if (category !== undefined) itemUpdates.category = category || null

  if (Object.keys(itemUpdates).length > 0) {
    const { error } = await supabase
      .from('inventory_items')
      .update(itemUpdates)
      .eq('id', id)
      .eq('business_id', DEMO_BUSINESS_ID)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If quantity provided, record a manual count
  if (quantity_on_hand !== null && quantity_on_hand !== undefined) {
    const today = new Date().toISOString().slice(0, 10)

    const { data: upload, error: uploadError } = await supabase
      .from('inventory_count_uploads')
      .insert({ business_id: DEMO_BUSINESS_ID, filename: 'Manual adjustment', count_date: today, row_count: 1 })
      .select('id')
      .single()
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    // Get item name for raw_item_name
    const { data: item } = await supabase
      .from('inventory_items')
      .select('name, unit')
      .eq('id', id)
      .single()

    const { error: countError } = await supabase
      .from('inventory_counts')
      .insert({
        upload_id: upload.id,
        business_id: DEMO_BUSINESS_ID,
        count_date: today,
        raw_item_name: item?.name ?? '',
        inventory_item_id: id,
        quantity_on_hand: Number(quantity_on_hand),
        unit_type: item?.unit ?? null,
      })
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
