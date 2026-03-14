import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

interface ImportItem {
  name: string
  unit: string
  category: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { items }: { items: ImportItem[] } = await req.json()

    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 })

    // Fetch existing item names to skip duplicates
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('name')
      .eq('business_id', businessId)

    const existingNames = new Set((existing ?? []).map(i => i.name.toLowerCase().trim()))

    const toInsert = items
      .filter(i => !existingNames.has(i.name.toLowerCase().trim()))
      .map(i => ({
        business_id: businessId,
        name: i.name.trim(),
        unit: i.unit,
        category: i.category || null,
        item_type: 'beverage',
      }))

    if (toInsert.length === 0) {
      return NextResponse.json({ imported: 0, skipped: items.length })
    }

    const { error } = await supabase.from('inventory_items').insert(toInsert)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ imported: toInsert.length, skipped: items.length - toInsert.length })
  } catch (e) {
    return authErrorResponse(e)
  }
}
