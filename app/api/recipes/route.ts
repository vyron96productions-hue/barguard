import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { menu_item_id, inventory_item_id, quantity, unit } = body

    if (!menu_item_id || !inventory_item_id || quantity == null || !unit) {
      return NextResponse.json({ error: 'menu_item_id, inventory_item_id, quantity, and unit are required' }, { status: 400 })
    }

    // Verify menu item belongs to this business
    const { data: menuItem } = await supabase.from('menu_items').select('id').eq('id', menu_item_id).eq('business_id', businessId).single()
    if (!menuItem) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('menu_item_recipes')
      .upsert({ menu_item_id, inventory_item_id, quantity, unit }, { onConflict: 'menu_item_id,inventory_item_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) { return authErrorResponse(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await req.json()
    const { inventory_item_id, quantity, unit } = body

    // Verify recipe belongs to this business — filter on the joined menu_item's business_id
    // so a user from Business A cannot update recipes owned by Business B
    const { data: recipe } = await supabase
      .from('menu_item_recipes')
      .select('id, menu_items!inner(business_id)')
      .eq('id', id)
      .eq('menu_items.business_id', businessId)
      .single()
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('menu_item_recipes')
      .update({ inventory_item_id, quantity, unit })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) { return authErrorResponse(e) }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'manager')
    const { supabase, businessId } = ctx
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Verify recipe belongs to this business via the menu item
    const { data: recipe } = await supabase
      .from('menu_item_recipes')
      .select('id, menu_items!inner(business_id)')
      .eq('id', id)
      .eq('menu_items.business_id', businessId)
      .single()
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

    const { error } = await supabase.from('menu_item_recipes').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
