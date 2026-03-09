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
