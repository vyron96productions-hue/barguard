import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import { generateProfitInsights } from '@/lib/ai'

// Store profit insights in ai_summaries with this sentinel shift_label
const PROFIT_SHIFT_LABEL = '__profit_insights__'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { period_start, period_end, summaries } = body

    if (!period_start || !period_end || !Array.isArray(summaries) || summaries.length === 0) {
      return NextResponse.json({ error: 'period_start, period_end, and summaries are required' }, { status: 400 })
    }

    const insightText = await generateProfitInsights({ periodStart: period_start, periodEnd: period_end, summaries })

    // Upsert: delete any existing insight for this period, then insert fresh
    await supabase
      .from('ai_summaries')
      .delete()
      .eq('business_id', DEMO_BUSINESS_ID)
      .eq('period_start', period_start)
      .eq('period_end', period_end)
      .eq('shift_label', PROFIT_SHIFT_LABEL)

    const { data: saved, error: saveError } = await supabase
      .from('ai_summaries')
      .insert({
        business_id:  DEMO_BUSINESS_ID,
        period_start,
        period_end,
        summary_text: insightText,
        shift_label:  PROFIT_SHIFT_LABEL,
      })
      .select()
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })
    return NextResponse.json(saved)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodStart = searchParams.get('period_start')
  const periodEnd   = searchParams.get('period_end')

  if (!periodStart || !periodEnd) {
    return NextResponse.json(null)
  }

  const { data } = await supabase
    .from('ai_summaries')
    .select('*')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('shift_label', PROFIT_SHIFT_LABEL)
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json(data?.[0] ?? null)
}
