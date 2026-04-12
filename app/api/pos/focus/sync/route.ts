import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { fetchFocusSales } from '@/lib/pos/focus'
import { importPosItemsToSupabase, autoCreateMenuItemsFromSales, logPosSync } from '@/lib/pos/sync'

export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { period_start, period_end } = await req.json()

    if (!period_start || !period_end) {
      return NextResponse.json(
        { error: 'period_start and period_end required' },
        { status: 400 }
      )
    }

    const { data: conn } = await supabase
      .from('pos_connections')
      .select('*')
      .eq('business_id', businessId)
      .eq('pos_type', 'focus')
      .eq('is_active', true)
      .single()

    if (!conn) {
      return NextResponse.json({ error: 'Focus POS not connected' }, { status: 400 })
    }

    const focusDns  = conn.location_id   // DNS subdomain
    const storeKey  = conn.merchant_id   // store key
    const apiKey    = conn.access_token
    const apiSecret = conn.refresh_token

    if (!focusDns || !storeKey || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Focus POS credentials incomplete — please reconnect' }, { status: 400 })
    }

    const items = await fetchFocusSales(focusDns, storeKey, apiKey, apiSecret, period_start, period_end)

    const count = await importPosItemsToSupabase('focus', period_start, period_end, items, businessId)
    await autoCreateMenuItemsFromSales(items, businessId)
    await logPosSync('focus', period_start, period_end, 'success', count, businessId)

    return NextResponse.json({ imported: count })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    await logPosSync('focus', '', '', 'error', 0, '', msg).catch(() => {})
    return authErrorResponse(e)
  }
}
