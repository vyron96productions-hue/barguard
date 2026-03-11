import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { counts } = await req.json() as {
      counts: Array<{ id: string; quantity: number }>
    }

    if (!Array.isArray(counts) || counts.length === 0) {
      return NextResponse.json({ error: 'counts array required' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    // Verify all items belong to this business and get their names/units
    const ids = counts.map((c) => c.id)
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, name, unit')
      .eq('business_id', businessId)
      .in('id', ids)

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    const itemMap = new Map((items ?? []).map((i) => [i.id, i]))
    const validCounts = counts.filter((c) => itemMap.has(c.id))

    if (validCounts.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 })
    }

    // Create one upload record for the whole batch
    const { data: upload, error: uploadError } = await supabase
      .from('inventory_count_uploads')
      .insert({
        business_id: businessId,
        filename: `Manual count — ${today}`,
        count_date: today,
        row_count: validCounts.length,
      })
      .select('id')
      .single()

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const rows = validCounts.map((c) => {
      const item = itemMap.get(c.id)!
      return {
        upload_id: upload.id,
        business_id: businessId,
        count_date: today,
        raw_item_name: item.name,
        inventory_item_id: c.id,
        quantity_on_hand: c.quantity,
        unit_type: item.unit,
      }
    })

    const { error: countError } = await supabase
      .from('inventory_counts')
      .upsert(rows, { onConflict: 'business_id,inventory_item_id,count_date' })

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

    return NextResponse.json({ saved: validCounts.length, date: today })
  } catch (e) { return authErrorResponse(e) }
}
