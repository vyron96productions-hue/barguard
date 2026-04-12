import { adminSupabase } from '@/lib/supabase/admin'
import { fetchToastSales, connectToast } from './toast'
import { fetchSquareSales } from './square'
import { fetchCloverSales } from './clover'
import { fetchFocusSales } from './focus'
import { importPosItemsToSupabase, autoCreateMenuItemsFromSales, logPosSync } from './sync'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'pos/auto-sync'

// Minimum gap between auto-syncs per connection to avoid hammering POS APIs
const CRON_STALENESS_MS = 4 * 60 * 1000   // cron: skip if synced within 4 min
const VISIT_STALENESS_MS = 2 * 60 * 1000  // on-visit: skip if synced within 2 min

export type PosConnectionRow = {
  id: string
  business_id: string
  pos_type: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  merchant_id: string | null
  location_id: string | null
  last_synced_at: string | null
  client_secret?: string | null
}

/**
 * Syncs today's sales for a single POS connection.
 * Handles all providers and Toast token refresh.
 * Returns number of transactions imported (0 on error).
 */
export async function syncTodayForConnection(conn: PosConnectionRow): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const { business_id: businessId, pos_type: posType } = conn

  try {
    let items: Awaited<ReturnType<typeof fetchSquareSales>> = []

    switch (posType) {
      case 'toast': {
        let accessToken = conn.access_token
        if (conn.token_expires_at) {
          const expiresAt = new Date(conn.token_expires_at).getTime()
          const nearExpiry = expiresAt - Date.now() < 5 * 60 * 1000
          if (nearExpiry && conn.client_secret) {
            const reauthed = await connectToast(conn.merchant_id!, conn.client_secret, conn.location_id!)
            accessToken = reauthed.access_token
            const newExpiresAt = reauthed.expires_in
              ? new Date(Date.now() + reauthed.expires_in * 1000).toISOString()
              : null
            await adminSupabase.from('pos_connections').update({
              access_token: reauthed.access_token,
              refresh_token: reauthed.refresh_token ?? null,
              ...(newExpiresAt ? { token_expires_at: newExpiresAt } : {}),
            }).eq('id', conn.id)
          }
        }
        items = await fetchToastSales(accessToken, conn.location_id!, today, today)
        break
      }
      case 'square': {
        items = await fetchSquareSales(conn.access_token, conn.location_id!, today, today)
        break
      }
      case 'clover': {
        items = await fetchCloverSales(conn.access_token, conn.location_id!, today, today)
        break
      }
      case 'focus': {
        items = await fetchFocusSales(conn.location_id!, conn.merchant_id!, conn.access_token, conn.refresh_token!, today, today)
        break
      }
      default:
        logger.warn(ROUTE, `Unknown POS type — skipping`, { businessId, posType })
        return 0
    }

    const count = await importPosItemsToSupabase(posType as never, today, today, items, businessId)

    if (posType === 'toast' || posType === 'focus') {
      await autoCreateMenuItemsFromSales(items, businessId)
    }

    await logPosSync(posType as never, today, today, 'success', count, businessId)
    logger.info(ROUTE, 'Auto-sync complete', { businessId, posType, imported: count })
    return count
  } catch (e) {
    logError(ROUTE, e, { businessId, posType })
    await logPosSync(posType as never, today, today, 'error', 0, businessId, e instanceof Error ? e.message : 'Auto-sync failed').catch(() => {})
    return 0
  }
}

/**
 * Returns all active POS connections for a business that are stale enough to sync.
 */
export async function getConnectionsDueForSync(businessId: string, staleAfterMs: number): Promise<PosConnectionRow[]> {
  const { data } = await adminSupabase
    .from('pos_connections')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)

  return (data ?? []).filter((conn) => {
    if (!conn.last_synced_at) return true
    return Date.now() - new Date(conn.last_synced_at).getTime() > staleAfterMs
  })
}

/**
 * Returns all active POS connections across all businesses that are stale enough to sync.
 * Used by the cron job.
 */
export async function getAllConnectionsDueForSync(staleAfterMs: number): Promise<PosConnectionRow[]> {
  const { data } = await adminSupabase
    .from('pos_connections')
    .select('*')
    .eq('is_active', true)

  return (data ?? []).filter((conn) => {
    if (!conn.last_synced_at) return true
    return Date.now() - new Date(conn.last_synced_at).getTime() > staleAfterMs
  })
}

export { CRON_STALENESS_MS, VISIT_STALENESS_MS }
