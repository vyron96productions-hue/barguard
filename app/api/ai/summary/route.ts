import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { generateVarianceSummary } from '@/lib/ai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { period_start, period_end, shift_label, total_revenue, total_covers } = body

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    let summaryQuery = supabase
      .from('inventory_usage_summaries')
      .select('*, inventory_item:inventory_items(id, name, unit, category)')
      .eq('business_id', businessId)
      .gte('period_start', period_start)
      .lte('period_end', period_end)

    if (shift_label) summaryQuery = summaryQuery.eq('shift_label', shift_label)

    const { data: summaries, error } = await summaryQuery

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!summaries || summaries.length === 0) {
      return NextResponse.json({ error: 'No variance data found for this period. Run calculations first.' }, { status: 400 })
    }

    const summaryText = await generateVarianceSummary({
      periodStart: period_start,
      periodEnd: period_end,
      shiftLabel: shift_label ?? null,
      totalRevenue: total_revenue ?? null,
      totalCovers: total_covers ?? null,
      summaries,
    })

    const { data: saved, error: saveError } = await supabase
      .from('ai_summaries')
      .insert({
        business_id: businessId,
        period_start,
        period_end,
        summary_text: summaryText,
        shift_label: shift_label ?? null,
      })
      .select()
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    return NextResponse.json(saved)
  } catch (e) { return authErrorResponse(e) }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const periodStart = searchParams.get('period_start')
    const periodEnd   = searchParams.get('period_end')
    const shiftLabel  = searchParams.get('shift_label')

    let query = supabase
      .from('ai_summaries')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (periodStart) query = query.gte('period_start', periodStart)
    if (periodEnd)   query = query.lte('period_end', periodEnd)
    if (shiftLabel !== null) query = query.eq('shift_label', shiftLabel)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data?.[0] ?? null)
  } catch (e) { return authErrorResponse(e) }
}
