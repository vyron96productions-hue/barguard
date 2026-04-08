import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import type { BootstrapResult } from '../route'

// POST /api/recipes/ai-bootstrap/confirm
// Saves the ingredients and recipes returned by ai-bootstrap.
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body: BootstrapResult = await req.json()
    const { ingredients, recipes } = body

    if (!ingredients?.length || !recipes?.length) {
      return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
    }

    // 1. Upsert inventory items (skip existing names)
    const { data: insertedItems, error: invErr } = await supabase
      .from('inventory_items')
      .upsert(
        ingredients.map((ing) => ({
          business_id: businessId,
          name: ing.name,
          unit: ing.unit,
          item_type: ing.item_type,
        })),
        { onConflict: 'business_id,name', ignoreDuplicates: true }
      )
      .select('id, name')

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

    // 2. Build name → id map from what was just inserted + any already-existing items
    const { data: allItems } = await supabase
      .from('inventory_items')
      .select('id, name')
      .eq('business_id', businessId)
      .in('name', ingredients.map((i) => i.name))

    const nameToId = new Map((allItems ?? []).map((i) => [i.name.toLowerCase().trim(), i.id]))

    // 3. Build recipe rows, resolving ingredient_name → inventory_item_id
    const recipeRows = recipes
      .map((r) => ({
        menu_item_id: r.menu_item_id,
        inventory_item_id: nameToId.get(r.ingredient_name.toLowerCase().trim()),
        quantity: r.quantity,
        unit: r.unit,
      }))
      .filter((r) => r.inventory_item_id != null)

    if (recipeRows.length === 0) {
      return NextResponse.json({ error: 'Could not resolve any ingredients to inventory items' }, { status: 400 })
    }

    // 4. Upsert recipes (skip duplicates)
    const { error: recipeErr } = await supabase
      .from('menu_item_recipes')
      .upsert(recipeRows as any[], { onConflict: 'menu_item_id,inventory_item_id', ignoreDuplicates: true })

    if (recipeErr) return NextResponse.json({ error: recipeErr.message }, { status: 500 })

    return NextResponse.json({
      inventory_items_created: insertedItems?.length ?? 0,
      recipes_created: recipeRows.length,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
