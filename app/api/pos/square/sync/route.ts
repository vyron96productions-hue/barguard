import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { fetchSquareSales } from '@/lib/pos/square'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'pos/square/sync'

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
      .eq('pos_type', 'square')
      .eq('is_active', true)
      .single()

    if (!conn) {
      logger.warn(ROUTE, 'Square not connected', { businessId })
      return NextResponse.json({ error: 'Square not connected' }, { status: 400 })
    }

    logger.info(ROUTE, 'Sync started', { businessId, period_start, period_end })

    const items = await fetchSquareSales(conn.access_token, conn.location_id, period_start, period_end)
    logger.info(ROUTE, 'Orders fetched from Square', { businessId, raw_items: items.length })

    const count = await importPosItemsToSupabase('square', period_start, period_end, items, businessId)
    await logPosSync('square', period_start, period_end, 'success', count, businessId)

    logger.info(ROUTE, 'Sync complete', { businessId, imported: count })
    return NextResponse.json({ imported: count })
  } catch (e: unknown) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
