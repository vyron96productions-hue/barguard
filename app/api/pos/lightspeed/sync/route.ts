import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { fetchLightspeedSales } from '@/lib/pos/lightspeed'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'

export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { period_start, period_end } = await req.json()
    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })
    }

    const { data: conn } = await supabase
      .from('pos_connections')
      .select('*')
      .eq('business_id', businessId)
      .eq('pos_type', 'lightspeed')
      .eq('is_active', true)
      .single()

    if (!conn) return NextResponse.json({ error: 'Lightspeed not connected' }, { status: 400 })

    const items = await fetchLightspeedSales(conn.access_token, conn.location_id, period_start, period_end)
    const count = await importPosItemsToSupabase('lightspeed', period_start, period_end, items, businessId)
    await logPosSync('lightspeed', period_start, period_end, 'success', count, businessId)

    return NextResponse.json({ imported: count })
  } catch (e: unknown) {
    return authErrorResponse(e)
  }
}
