import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import { fetchLightspeedSales } from '@/lib/pos/lightspeed'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'

export async function POST(req: Request) {
  try {
    const { period_start, period_end } = await req.json()
    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })
    }

    const { data: conn } = await supabase
      .from('pos_connections')
      .select('*')
      .eq('business_id', DEMO_BUSINESS_ID)
      .eq('pos_type', 'lightspeed')
      .eq('is_active', true)
      .single()

    if (!conn) return NextResponse.json({ error: 'Lightspeed not connected' }, { status: 400 })

    const items = await fetchLightspeedSales(conn.access_token, conn.location_id, period_start, period_end)
    const count = await importPosItemsToSupabase('lightspeed', period_start, period_end, items)
    await logPosSync('lightspeed', period_start, period_end, 'success', count)

    return NextResponse.json({ imported: count })
  } catch (e: any) {
    await logPosSync('lightspeed', '', '', 'error', 0, e.message).catch(() => {})
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
