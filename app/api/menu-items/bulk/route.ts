import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// POST /api/menu-items/bulk
// Bulk-create menu items, skipping duplicates. Returns [{id, name}] for all items (new + existing).
export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { items } = await req.json() as {
      items: Array<{ name: string; category?: string; item_type?: string; sell_price?: number | null }>
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
    }

    const rows = items.map((item) => ({
      business_id: businessId,
      name: item.name.trim(),
      category: item.category || null,
      item_type: item.item_type || 'drink',
      sell_price: item.sell_price ?? null,
    }))

    const names = rows.map((r) => r.name)

    // Insert new items, silently skip any that already exist
    const { error: upsertError } = await supabase
      .from('menu_items')
      .upsert(rows, { onConflict: 'business_id,name', ignoreDuplicates: true })

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

    // Fetch all matching items (new + pre-existing) so recipes can link to them
    const { data, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('business_id', businessId)
      .in('name', names)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const created = data ?? []
    const skipped = names.filter((n) => !created.find((d) => d.name === n))

    return NextResponse.json({
      created,
      skipped_count: skipped.length,
      ...(skipped.length > 0 && { skipped_names: skipped }),
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
