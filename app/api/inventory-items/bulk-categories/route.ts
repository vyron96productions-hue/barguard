import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

const FOOD_CATS = new Set(['food', 'kitchen', 'produce', 'protein', 'dairy', 'dry goods', 'sauces', 'condiments', 'dessert', 'supply'])
const BEV_CATS = new Set(['spirits', 'beer', 'wine', 'keg', 'mixer', 'non-alcoholic', 'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac', 'liqueur'])

// PATCH /api/inventory-items/bulk-categories
// Update category (and inferred item_type) for multiple inventory items at once
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { updates } = await req.json() as {
      updates: Array<{ id: string; category: string }>
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 })
    }

    const results = await Promise.all(
      updates.map(({ id, category }) => {
        const catLower = category.toLowerCase()
        const item_type = FOOD_CATS.has(catLower)
          ? 'food'
          : BEV_CATS.has(catLower)
          ? 'beverage'
          : undefined

        const payload: Record<string, string> = { category }
        if (item_type) payload.item_type = item_type

        return supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', id)
          .eq('business_id', businessId)
      })
    )

    const errors = results.filter((r) => r.error).map((r) => r.error?.message)
    if (errors.length > 0) return NextResponse.json({ error: errors[0] }, { status: 500 })

    return NextResponse.json({ updated: updates.length })
  } catch (e) {
    return authErrorResponse(e)
  }
}
