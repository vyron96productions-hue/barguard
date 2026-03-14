import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

    const { data: items, error } = await supabase
      .from('drink_library_items')
      .select(`
        *,
        ingredients:drink_library_ingredients(
          *,
          inventory_item:inventory_items(id, name, unit, cost_per_oz)
        ),
        aliases:drink_library_aliases(id, drink_library_id, alias)
      `)
      .eq('business_id', businessId)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!items) return NextResponse.json([])

    const sorted = items.map((item) => ({
      ...item,
      ingredients: [...(item.ingredients ?? [])].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
    }))

    if (!q) return NextResponse.json(sorted)

    const filtered = sorted.filter((item) => {
      if (item.name.toLowerCase().includes(q)) return true
      return (item.aliases ?? []).some((a: { alias: string }) => a.alias.toLowerCase().includes(q))
    })

    return NextResponse.json(filtered)
  } catch (e) { return authErrorResponse(e) }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { name, category, glassware, garnish, instructions, notes, ingredients } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data: item, error } = await supabase
      .from('drink_library_items')
      .insert({
        business_id: businessId,
        name: name.trim(),
        category: category?.trim() || null,
        glassware: glassware?.trim() || null,
        garnish: garnish?.trim() || null,
        instructions: instructions?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const { error: ingError } = await supabase.from('drink_library_ingredients').insert(
        ingredients.map((ing: { ingredient_name: string; quantity_oz: number; notes?: string }, i: number) => ({
          drink_library_id: item.id,
          inventory_item_id: null,
          ingredient_name: ing.ingredient_name,
          quantity_oz: Number(ing.quantity_oz),
          sort_order: i + 1,
          notes: ing.notes || null,
        }))
      )
      if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 })
    }

    const { data: full } = await supabase
      .from('drink_library_items')
      .select(`*, ingredients:drink_library_ingredients(*, inventory_item:inventory_items(id, name, unit, cost_per_oz)), aliases:drink_library_aliases(id, drink_library_id, alias)`)
      .eq('id', item.id)
      .single()

    return NextResponse.json(full)
  } catch (e) { return authErrorResponse(e) }
}
