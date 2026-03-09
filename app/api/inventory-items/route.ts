import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('category', { nullsFirst: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, unit, category, pack_size, package_type } = body

  if (!name || !unit) {
    return NextResponse.json({ error: 'name and unit are required' }, { status: 400 })
  }

  const packSizeVal = pack_size ? parseInt(pack_size, 10) : null
  if (packSizeVal !== null && (isNaN(packSizeVal) || packSizeVal < 1)) {
    return NextResponse.json({ error: 'pack_size must be a positive integer' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      business_id: DEMO_BUSINESS_ID,
      name: name.trim(),
      unit,
      category: category || null,
      pack_size: packSizeVal,
      package_type: package_type || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, name, category, package_type } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, string | number | null> = {}
  if (name !== undefined) updates.name = name.trim()
  if (category !== undefined) updates.category = category || null
  if (package_type !== undefined) updates.package_type = package_type || null
  if (body.pack_size !== undefined) updates.pack_size = body.pack_size ? parseInt(body.pack_size, 10) : null
  if (body.cost_per_oz !== undefined) {
    const v = body.cost_per_oz !== '' ? parseFloat(body.cost_per_oz) : null
    updates.cost_per_oz = v !== null && !isNaN(v) ? v : null
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .eq('business_id', DEMO_BUSINESS_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('business_id', DEMO_BUSINESS_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
