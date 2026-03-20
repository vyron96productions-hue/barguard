import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// PATCH /api/inventory-items/bulk-prices
// Update cost_per_unit for multiple inventory items at once
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { updates } = await req.json() as {
      updates: Array<{ id: string; cost_per_unit: number | null }>
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 })
    }

    const results = await Promise.all(
      updates.map(({ id, cost_per_unit }) =>
        supabase
          .from('inventory_items')
          .update({ cost_per_unit })
          .eq('id', id)
          .eq('business_id', businessId)
      )
    )

    const errors = results.filter((r) => r.error).map((r) => r.error?.message)
    if (errors.length > 0) return NextResponse.json({ error: errors[0] }, { status: 500 })

    return NextResponse.json({ updated: updates.length })
  } catch (e) {
    return authErrorResponse(e)
  }
}
