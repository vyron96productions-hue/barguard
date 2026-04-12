import { NextResponse } from 'next/server'
import { logger, logError } from '@/lib/logger'
import { getAllConnectionsDueForSync, syncTodayForConnection, CRON_STALENESS_MS } from '@/lib/pos/auto-sync'

const ROUTE = 'cron/sync-pos-sales'

export async function GET(req: Request) {
  // Verify cron secret
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info(ROUTE, 'POS auto-sync cron started')

  try {
    const connections = await getAllConnectionsDueForSync(CRON_STALENESS_MS)

    if (connections.length === 0) {
      logger.info(ROUTE, 'No connections due for sync')
      return NextResponse.json({ synced: 0 })
    }

    logger.info(ROUTE, `Syncing ${connections.length} connection(s)`, {
      businesses: [...new Set(connections.map((c) => c.business_id))].length,
    })

    const results = await Promise.allSettled(
      connections.map((conn) => syncTodayForConnection(conn))
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    logger.info(ROUTE, 'Cron complete', { total: connections.length, succeeded, failed })
    return NextResponse.json({ synced: succeeded, failed })
  } catch (e) {
    logError(ROUTE, e, {})
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
