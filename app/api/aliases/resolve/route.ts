import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

/**
 * POST /api/aliases/resolve
 *
 * Saves an alias mapping and back-fills historical records.
 *
 * Body:
 *   type              'menu' | 'inventory'
 *   raw_name          The raw POS/invoice string to map
 *   target_id         UUID of the menu_item or inventory_item to link to
 *   overwrite_existing  (optional, default false)
 *     false — only fills records where the FK is currently NULL (safe default).
 *     true  — updates ALL historical records with this raw_name, overwriting
 *             any previously-set link. Use this to correct a wrong alias.
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { type, raw_name, target_id, overwrite_existing = false } = body

    if (!type || !raw_name || !target_id) {
      return NextResponse.json({ error: 'type, raw_name, and target_id are required' }, { status: 400 })
    }

    if (type === 'menu') {
      // Upsert the alias — always overwrites the stored mapping
      const { error } = await supabase
        .from('menu_item_aliases')
        .upsert({ business_id: businessId, raw_name, menu_item_id: target_id }, { onConflict: 'business_id,raw_name' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Back-fill sales_transactions — ilike for case-insensitive exact match
      let txQuery = supabase
        .from('sales_transactions')
        .update({ menu_item_id: target_id })
        .eq('business_id', businessId)
        .ilike('raw_item_name', raw_name)
      if (!overwrite_existing) txQuery = txQuery.is('menu_item_id', null)
      const { error: txErr } = await txQuery
      if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

    } else if (type === 'inventory') {
      // Upsert the alias — always overwrites the stored mapping
      const { error } = await supabase
        .from('inventory_item_aliases')
        .upsert({ business_id: businessId, raw_name, inventory_item_id: target_id }, { onConflict: 'business_id,raw_name' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Back-fill inventory_counts and purchases — ilike for case-insensitive exact match
      let countsQuery = supabase
        .from('inventory_counts')
        .update({ inventory_item_id: target_id })
        .eq('business_id', businessId)
        .ilike('raw_item_name', raw_name)
      if (!overwrite_existing) countsQuery = countsQuery.is('inventory_item_id', null)
      const { error: countsErr } = await countsQuery
      if (countsErr) return NextResponse.json({ error: countsErr.message }, { status: 500 })

      let purchasesQuery = supabase
        .from('purchases')
        .update({ inventory_item_id: target_id })
        .eq('business_id', businessId)
        .ilike('raw_item_name', raw_name)
      if (!overwrite_existing) purchasesQuery = purchasesQuery.is('inventory_item_id', null)
      const { error: purchasesErr } = await purchasesQuery
      if (purchasesErr) return NextResponse.json({ error: purchasesErr.message }, { status: 500 })

    } else {
      return NextResponse.json({ error: 'type must be "menu" or "inventory"' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
