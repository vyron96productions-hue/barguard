import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import { generateVarianceSummary } from '@/lib/ai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { period_start, period_end } = body

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    const { data: summaries, error } = await supabase
      .from('inventory_usage_summaries')
      .select('*, inventory_item:inventory_items(id, name, unit, category)')
      .eq('business_id', DEMO_BUSINESS_ID)
      .gte('period_start', period_start)
      .lte('period_end', period_end)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!summaries || summaries.length === 0) {
      return NextResponse.json({ error: 'No variance data found for this period. Run calculations first.' }, { status: 400 })
    }

    const summaryText = await generateVarianceSummary({ periodStart: period_start, periodEnd: period_end, summaries })

    const { data: saved, error: saveError } = await supabase
      .from('ai_summaries')
      .insert({ business_id: DEMO_BUSINESS_ID, period_start, period_end, summary_text: summaryText })
      .select()
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    return NextResponse.json(saved)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodStart = searchParams.get('period_start')
  const periodEnd = searchParams.get('period_end')

  let query = supabase
    .from('ai_summaries')
    .select('*')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('created_at', { ascending: false })
    .limit(1)

  if (periodStart) query = query.gte('period_start', periodStart)
  if (periodEnd) query = query.lte('period_end', periodEnd)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data?.[0] ?? null)
}
