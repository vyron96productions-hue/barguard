import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { type, raw_name, target_id } = body

    if (!type || !raw_name || !target_id) {
      return NextResponse.json({ error: 'type, raw_name, and target_id are required' }, { status: 400 })
    }

    if (type === 'menu') {
      const { error } = await supabase
        .from('menu_item_aliases')
        .upsert({ business_id: businessId, raw_name, menu_item_id: target_id }, { onConflict: 'business_id,raw_name' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabase
        .from('sales_transactions')
        .update({ menu_item_id: target_id })
        .eq('business_id', businessId)
        .eq('raw_item_name', raw_name)
        .is('menu_item_id', null)

    } else if (type === 'inventory') {
      const { error } = await supabase
        .from('inventory_item_aliases')
        .upsert({ business_id: businessId, raw_name, inventory_item_id: target_id }, { onConflict: 'business_id,raw_name' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabase.from('inventory_counts').update({ inventory_item_id: target_id }).eq('business_id', businessId).eq('raw_item_name', raw_name).is('inventory_item_id', null)
      await supabase.from('purchases').update({ inventory_item_id: target_id }).eq('business_id', businessId).eq('raw_item_name', raw_name).is('inventory_item_id', null)

    } else {
      return NextResponse.json({ error: 'type must be "menu" or "inventory"' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
