import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { recipes } = body as {
      recipes: Array<{ menu_item_id: string; inventory_item_id: string; quantity: number; unit: string }>
    }

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: 'recipes array required' }, { status: 400 })
    }

    // Verify all menu items belong to this business
    const menuItemIds = [...new Set(recipes.map((r) => r.menu_item_id))]
    const { data: ownedItems } = await supabase
      .from('menu_items')
      .select('id')
      .eq('business_id', businessId)
      .in('id', menuItemIds)

    const ownedIds = new Set((ownedItems ?? []).map((i) => i.id))
    const validRecipes = recipes.filter((r) => ownedIds.has(r.menu_item_id))

    if (validRecipes.length === 0) {
      return NextResponse.json({ error: 'No valid recipes to save' }, { status: 400 })
    }

    const { error } = await supabase
      .from('menu_item_recipes')
      .upsert(
        validRecipes.map((r) => ({
          menu_item_id: r.menu_item_id,
          inventory_item_id: r.inventory_item_id,
          quantity: r.quantity,
          unit: r.unit,
        })),
        { onConflict: 'menu_item_id,inventory_item_id' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: validRecipes.length })
  } catch (e) { return authErrorResponse(e) }
}
