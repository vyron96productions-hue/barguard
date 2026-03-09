import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

  // Fetch all drink library items with ingredients and aliases
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
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!items) return NextResponse.json([])

  // Sort ingredients by sort_order client-side (Supabase nested select doesn't guarantee order)
  const sorted = items.map((item) => ({
    ...item,
    ingredients: [...(item.ingredients ?? [])].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
  }))

  // Filter by search query (name or alias match)
  if (!q) return NextResponse.json(sorted)

  const filtered = sorted.filter((item) => {
    if (item.name.toLowerCase().includes(q)) return true
    return (item.aliases ?? []).some((a: { alias: string }) => a.alias.toLowerCase().includes(q))
  })

  return NextResponse.json(filtered)
}
