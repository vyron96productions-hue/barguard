import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { menu_item_id, inventory_item_id, quantity, unit } = body

  if (!menu_item_id || !inventory_item_id || quantity == null || !unit) {
    return NextResponse.json({ error: 'menu_item_id, inventory_item_id, quantity, and unit are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('menu_item_recipes')
    .upsert({ menu_item_id, inventory_item_id, quantity, unit }, { onConflict: 'menu_item_id,inventory_item_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('menu_item_recipes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
