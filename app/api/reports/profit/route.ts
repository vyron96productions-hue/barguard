import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const periodStart = searchParams.get('period_start')
    const periodEnd = searchParams.get('period_end')
    const shiftLabel = searchParams.get('shift_label')

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    let query = supabase
      .from('drink_profit_summaries')
      .select(`*, menu_item:menu_items(id, name, category)`)
      .eq('business_id', businessId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (shiftLabel !== null) {
      query = query.eq('shift_label', shiftLabel)
    } else {
      query = query.is('shift_label', null)
    }

    const { data, error } = await query.order('estimated_profit', { ascending: false, nullsFirst: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) { return authErrorResponse(e) }
}
