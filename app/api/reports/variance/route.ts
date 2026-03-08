import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodStart = searchParams.get('period_start')
  const periodEnd = searchParams.get('period_end')

  let query = supabase
    .from('inventory_usage_summaries')
    .select('*, inventory_item:inventory_items(id, name, unit, category)')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('status', { ascending: false }) // critical first
    .order('variance_percent', { ascending: false })

  if (periodStart) query = query.gte('period_start', periodStart)
  if (periodEnd) query = query.lte('period_end', periodEnd)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
