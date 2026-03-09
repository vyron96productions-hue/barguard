import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

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
    const { name, category } = body

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('menu_items')
      .insert({ business_id: businessId, name: name.trim(), category: category || null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) { return authErrorResponse(e) }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
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
