import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// POST /api/menu-items/bulk
// Bulk-create menu items, returns [{id, name}] for each created item
export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { items } = await req.json() as {
      items: Array<{ name: string; category?: string; item_type?: string; sell_price?: number | null }>
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert(
        items.map((item) => ({
          business_id: businessId,
          name: item.name.trim(),
          category: item.category || null,
          item_type: item.item_type || 'drink',
          sell_price: item.sell_price ?? null,
        }))
      )
      .select('id, name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ created: data ?? [] })
  } catch (e) {
    return authErrorResponse(e)
  }
}
