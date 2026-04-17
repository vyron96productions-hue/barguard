import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, menu_item_recipes(*, inventory_item:inventory_items(*))')
      .eq('business_id', businessId)
      .order('category', { nullsFirst: false })
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) { return authErrorResponse(e) }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { name, category, item_type, subcategory } = body

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const sellPrice = body.sell_price !== undefined && body.sell_price !== ''
      ? parseFloat(body.sell_price) : null

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        business_id: businessId,
        name: name.trim(),
        category: category || null,
        subcategory: subcategory || null,
        item_type: item_type || 'drink',
        sell_price: sellPrice !== null && !isNaN(sellPrice) ? sellPrice : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) { return authErrorResponse(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, string | number | null> = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.category !== undefined) updates.category = body.category || null
    if (body.sell_price !== undefined) {
      const v = body.sell_price !== '' ? parseFloat(body.sell_price) : null
      updates.sell_price = v !== null && !isNaN(v) ? v : null
    }
    if (body.item_type !== undefined) updates.item_type = body.item_type || 'drink'
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory || null

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) { return authErrorResponse(e) }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')
    const { supabase, businessId } = ctx
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
