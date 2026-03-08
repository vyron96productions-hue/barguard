import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  // Find sales transactions with no menu_item_id
  const { data: salesUnmatched } = await supabase
    .from('sales_transactions')
    .select('raw_item_name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .is('menu_item_id', null)

  // Find inventory counts with no inventory_item_id
  const { data: invUnmatched } = await supabase
    .from('inventory_counts')
    .select('raw_item_name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .is('inventory_item_id', null)

  // Find purchases with no inventory_item_id
  const { data: purchaseUnmatched } = await supabase
    .from('purchases')
    .select('raw_item_name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .is('inventory_item_id', null)

  const unmatchedMenuNames = [...new Set((salesUnmatched ?? []).map((r) => r.raw_item_name))]
  const unmatchedInventoryNames = [...new Set([
    ...(invUnmatched ?? []).map((r) => r.raw_item_name),
    ...(purchaseUnmatched ?? []).map((r) => r.raw_item_name),
  ])]

  return NextResponse.json({ menu_names: unmatchedMenuNames, inventory_names: unmatchedInventoryNames })
}
