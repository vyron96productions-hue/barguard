import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, menu_item_recipes(*, inventory_item:inventory_items(*))')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('category', { nullsFirst: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ business_id: DEMO_BUSINESS_ID, name: name.trim(), category: category || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
    .eq('business_id', DEMO_BUSINESS_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
