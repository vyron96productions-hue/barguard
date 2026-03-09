import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [{ data: salesUnmatched }, { data: invUnmatched }, { data: purchaseUnmatched }] =
      await Promise.all([
        supabase.from('sales_transactions').select('raw_item_name').eq('business_id', businessId).is('menu_item_id', null),
        supabase.from('inventory_counts').select('raw_item_name').eq('business_id', businessId).is('inventory_item_id', null),
        supabase.from('purchases').select('raw_item_name').eq('business_id', businessId).is('inventory_item_id', null),
      ])

    const unmatchedMenuNames = [...new Set((salesUnmatched ?? []).map((r) => r.raw_item_name))]
    const unmatchedInventoryNames = [...new Set([
      ...(invUnmatched ?? []).map((r) => r.raw_item_name),
      ...(purchaseUnmatched ?? []).map((r) => r.raw_item_name),
    ])]

    return NextResponse.json({ menu_names: unmatchedMenuNames, inventory_names: unmatchedInventoryNames })
  } catch (e) { return authErrorResponse(e) }
}
