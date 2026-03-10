import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const periodStart = searchParams.get('period_start')
    const periodEnd   = searchParams.get('period_end')
    const shiftLabel  = searchParams.get('shift_label')

    const itemType = searchParams.get('item_type') // 'beverage' | 'food' | null for all

    let query = supabase
      .from('inventory_usage_summaries')
      .select('*, inventory_item:inventory_items(id, name, unit, category, item_type, cost_per_unit)')
      .eq('business_id', businessId)
      .order('status', { ascending: false })
      .order('variance_percent', { ascending: false })

    if (periodStart) query = query.gte('period_start', periodStart)
    if (periodEnd)   query = query.lte('period_end', periodEnd)
    if (shiftLabel !== null) query = query.eq('shift_label', shiftLabel)
    if (itemType) query = query.eq('inventory_item.item_type', itemType)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (e) { return authErrorResponse(e) }
}
