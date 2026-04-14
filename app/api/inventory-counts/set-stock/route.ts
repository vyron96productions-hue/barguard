import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { logError } from '@/lib/logger'

const ROUTE = 'inventory-counts/set-stock'

/**
 * Sets the current on-hand quantity for a single inventory item by upserting
 * an inventory_count record for today. Used by the inventory items page to
 * correct wrong baseline counts without a full upload.
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { inventory_item_id, quantity_on_hand } = await req.json()

    if (!inventory_item_id || quantity_on_hand == null) {
      return NextResponse.json({ error: 'inventory_item_id and quantity_on_hand are required' }, { status: 400 })
    }

    const qty = parseFloat(quantity_on_hand)
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json({ error: 'quantity_on_hand must be a non-negative number' }, { status: 400 })
    }

    // Verify item belongs to this business
    const { data: item } = await supabase
      .from('inventory_items')
      .select('id, name, unit')
      .eq('id', inventory_item_id)
      .eq('business_id', businessId)
      .single()

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const today = new Date().toISOString().slice(0, 10)

    // Ensure a count_upload record exists for manual corrections
    const { data: uploadRow } = await supabase
      .from('inventory_count_uploads')
      .insert({
        business_id: businessId,
        filename: 'manual-correction',
        count_date: today,
        row_count: 1,
      })
      .select('id')
      .single()

    const uploadId = uploadRow?.id ?? null

    // Upsert the count — overwrites any existing count for this item today
    const { error } = await supabase
      .from('inventory_counts')
      .upsert(
        {
          upload_id:          uploadId,
          business_id:        businessId,
          count_date:         today,
          raw_item_name:      item.name,
          inventory_item_id:  item.id,
          quantity_on_hand:   qty,
          unit_type:          item.unit,
        },
        { onConflict: 'business_id,inventory_item_id,count_date' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, quantity_on_hand: qty, unit: item.unit })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
