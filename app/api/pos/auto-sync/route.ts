import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { getConnectionsDueForSync, syncTodayForConnection, VISIT_STALENESS_MS } from '@/lib/pos/auto-sync'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'pos/auto-sync'

export async function POST(req: Request) {
  try {
    const { businessId } = await getAuthContext()

    const connections = await getConnectionsDueForSync(businessId, VISIT_STALENESS_MS)

    if (connections.length === 0) {
      return NextResponse.json({ synced: false, reason: 'recently_synced' })
    }

    logger.info(ROUTE, `On-visit sync triggered`, { businessId, count: connections.length })

    await Promise.allSettled(connections.map((conn) => syncTodayForConnection(conn)))

    return NextResponse.json({ synced: true })
  } catch (e) {
    logError(ROUTE, e, {})
    return authErrorResponse(e, ROUTE)
  }
}
