import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { generateSuggestions } from '@/lib/recipe-suggestions'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [{ data: menuItems }, { data: inventoryItems }, { data: recipes }] = await Promise.all([
      supabase
        .from('menu_items')
        .select('id, name, item_type')
        .eq('business_id', businessId),
      supabase
        .from('inventory_items')
        .select('id, name, unit, item_type')
        .eq('business_id', businessId),
      supabase
        .from('menu_item_recipes')
        .select('menu_item_id'),
    ])

    const existingIds = new Set((recipes ?? []).map((r) => r.menu_item_id))

    const suggestions = generateSuggestions(
      menuItems ?? [],
      inventoryItems ?? [],
      existingIds,
    )

    return NextResponse.json(suggestions)
  } catch (e) { return authErrorResponse(e) }
}
