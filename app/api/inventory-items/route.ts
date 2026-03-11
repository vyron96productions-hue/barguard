import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
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
    const { name, unit, category, pack_size, package_type, item_type } = body

    if (!name || !unit) {
      return NextResponse.json({ error: 'name and unit are required' }, { status: 400 })
    }

    const packSizeVal = pack_size ? parseInt(pack_size, 10) : null
    if (packSizeVal !== null && (isNaN(packSizeVal) || packSizeVal < 1)) {
      return NextResponse.json({ error: 'pack_size must be a positive integer' }, { status: 400 })
    }

    const costPerUnit = body.cost_per_unit !== undefined && body.cost_per_unit !== ''
      ? parseFloat(body.cost_per_unit) : null

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        business_id: businessId,
        name: name.trim(),
        unit,
        category: category || null,
        pack_size: packSizeVal,
        package_type: package_type || null,
        cost_per_unit: costPerUnit !== null && !isNaN(costPerUnit) ? costPerUnit : null,
        item_type: item_type || 'beverage',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-create a menu item + recipe for simple beverage units
    const autoRecipeUnit: Record<string, { qty: number; unit: string; category: string }> = {
      'bottle': { qty: 1.5, unit: 'oz', category: 'shot' },
      '1l':     { qty: 1.5, unit: 'oz', category: 'shot' },
      '1.75l':  { qty: 1.5, unit: 'oz', category: 'shot' },
      'can':    { qty: 1,   unit: 'can', category: 'beer' },
      'pint':   { qty: 1,   unit: 'pint', category: 'beer' },
    }

    const resolvedType = (item_type || 'beverage') as string
    const recipeDefaults = autoRecipeUnit[unit?.toLowerCase?.() ?? '']
    let autoMenuItemName: string | null = null

    if (resolvedType === 'beverage' && recipeDefaults && data) {
      // Create menu item with same name
      const { data: menuItem } = await supabase
        .from('menu_items')
        .insert({
          business_id: businessId,
          name: name.trim(),
          category: recipeDefaults.category,
          item_type: 'drink',
        })
        .select('id')
        .single()

      if (menuItem) {
        // Create recipe linking them
        await supabase.from('menu_item_recipes').insert({
          menu_item_id: menuItem.id,
          inventory_item_id: data.id,
          quantity: recipeDefaults.qty,
          unit: recipeDefaults.unit,
        })
        autoMenuItemName = name.trim()
      }
    }

    return NextResponse.json({ ...data, auto_menu_item: autoMenuItemName }, { status: 201 })
  } catch (e) { return authErrorResponse(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { id, name, category, package_type } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, string | number | null> = {}
    if (name !== undefined) updates.name = name.trim()
    if (body.unit !== undefined) updates.unit = body.unit
    if (category !== undefined) updates.category = category || null
    if (package_type !== undefined) updates.package_type = package_type || null
    if (body.pack_size !== undefined) updates.pack_size = body.pack_size ? parseInt(body.pack_size, 10) : null
    if (body.cost_per_oz !== undefined) {
      const v = body.cost_per_oz !== '' ? parseFloat(body.cost_per_oz) : null
      updates.cost_per_oz = v !== null && !isNaN(v) ? v : null
    }
    if (body.cost_per_unit !== undefined) {
      const v = body.cost_per_unit !== '' ? parseFloat(body.cost_per_unit) : null
      updates.cost_per_unit = v !== null && !isNaN(v) ? v : null
    }
    if (body.item_type !== undefined) updates.item_type = body.item_type || 'beverage'

    const { data, error } = await supabase
      .from('inventory_items')
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
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Verify item belongs to this business
    const { data: item } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    // Delete all related records first to avoid FK constraint errors
    await supabase.from('inventory_counts').delete().eq('inventory_item_id', id).eq('business_id', businessId)
    await supabase.from('inventory_item_aliases').delete().eq('inventory_item_id', id).eq('business_id', businessId)
    await supabase.from('purchases').update({ inventory_item_id: null }).eq('inventory_item_id', id).eq('business_id', businessId)
    await supabase.from('purchase_import_draft_lines').update({ inventory_item_id: null }).eq('inventory_item_id', id)

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
