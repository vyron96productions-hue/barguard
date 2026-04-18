import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { fetchToastSales, maybeRefreshToastToken } from '@/lib/pos/toast'
import { importPosItemsToSupabase, logPosSync, autoCreateMenuItemsFromSales } from '@/lib/pos/sync'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'pos/toast/sync'

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
      .eq('pos_type', 'toast')
      .eq('is_active', true)
      .single()

    if (!conn) {
      logger.warn(ROUTE, 'Toast not connected', { businessId })
      return NextResponse.json({ error: 'Toast not connected' }, { status: 400 })
    }

    logger.info(ROUTE, 'Sync started', { businessId, period_start, period_end, location: conn.location_id })

    // Auto-refresh token if expired or within 5 minutes of expiry.
    let accessToken: string
    try {
      accessToken = await maybeRefreshToastToken(conn)
    } catch (reAuthErr) {
      logError(ROUTE, reAuthErr, { businessId, context: 'token re-auth' })
      return NextResponse.json({
        error: 'Toast token expired and re-authentication failed. Please reconnect Toast in POS settings.',
      }, { status: 401 })
    }

    const items = await fetchToastSales(accessToken, conn.location_id, period_start, period_end)
    logger.info(ROUTE, 'Orders fetched from Toast', { businessId, raw_items: items.length })

    const count = await importPosItemsToSupabase('toast', period_start, period_end, items, businessId)
    const menuItemsCreated = await autoCreateMenuItemsFromSales(items, businessId)
    await logPosSync('toast', period_start, period_end, 'success', count, businessId)

    logger.info(ROUTE, 'Sync complete', { businessId, imported: count, menu_items_created: menuItemsCreated })
    return NextResponse.json({ imported: count, menu_items_created: menuItemsCreated })
  } catch (e: unknown) {
    logError(ROUTE, e, { })
    if (e instanceof Error && e.message.startsWith('Toast orders fetch failed')) {
      return NextResponse.json({ error: e.message }, { status: 502 })
    }
    return authErrorResponse(e, ROUTE)
  }
}
