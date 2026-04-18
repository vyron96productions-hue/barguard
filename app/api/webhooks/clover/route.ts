import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'
import type { NormalizedSaleItem } from '@/lib/pos/types'
import { logger } from '@/lib/logger'

const ROUTE = 'webhooks/clover'

const APP_SECRET = process.env.CLOVER_CLIENT_SECRET ?? ''

const BASE_API = process.env.CLOVER_ENVIRONMENT === 'production'
  ? 'https://api.clover.com'
  : 'https://apisandbox.dev.clover.com'

// Clover signs webhooks with HMAC-SHA256 of the raw body using the App Secret, base64 encoded
function verifyCloverSignature(rawBody: string, signatureHeader: string): boolean {
  if (!APP_SECRET) return false
  const hmac = crypto.createHmac('sha256', APP_SECRET)
  hmac.update(rawBody)
  const expected = hmac.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}

async function fetchCloverOrder(accessToken: string, merchantId: string, orderId: string) {
  const res = await fetch(
    `${BASE_API}/v3/merchants/${merchantId}/orders/${orderId}?expand=lineItems`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch Clover order')
  return data
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get('x-clover-auth') ?? ''

  // Parse body early so we can check for verificationCode before auth
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(rawBody) } catch { parsed = {} }

  // Clover verification pings arrive unsigned — only allow unsigned requests for those
  if (!signatureHeader) {
    if (parsed.verificationCode) return NextResponse.json({ received: true })
    logger.warn(ROUTE, 'Missing signature on non-verification request')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  if (!verifyCloverSignature(rawBody, signatureHeader)) {
    logger.warn(ROUTE, 'Signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Respond to signed verification pings too
  if (parsed.verificationCode) {
    return NextResponse.json({ received: true })
  }

  let event: {
    appId: string
    merchants: Record<string, {
      metaId: number
      data: { objectId: string; type: string; ts: number }[]
    }>
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Process each merchant's events
  for (const [merchantId, merchantData] of Object.entries(event.merchants ?? {})) {
    for (const item of merchantData.data ?? []) {
      // Only process order creates/updates
      if (!['CREATE', 'UPDATE'].includes(item.type)) continue

      const orderId = item.objectId

      // Look up which business this merchant belongs to
      const { data: conn } = await adminSupabase
        .from('pos_connections')
        .select('business_id, access_token')
        .eq('pos_type', 'clover')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .single()

      if (!conn) continue

      // ── Idempotency guard — atomic INSERT wins; retries get 23505 and no-op ──
      const { error: dedupError } = await adminSupabase
        .from('webhook_idempotency_keys')
        .insert({ provider: 'clover', event_id: orderId })

      if (dedupError?.code === '23505') continue // already processed
      if (dedupError) {
        // Non-duplicate error (e.g. 42P01 = table missing, network issue).
        // Log prominently but continue processing — a missed dedup is preferable to dropping a sale.
        logger.error(ROUTE, 'Dedup insert failed — continuing', { code: dedupError.code, error: dedupError.message, order_id: orderId })
      }

      try {
        const order = await fetchCloverOrder(conn.access_token, merchantId, orderId)

        // Only process paid orders
        if (!order.payType) continue

        const saleDate = order.createdTime
          ? new Date(order.createdTime as number).toLocaleDateString('en-CA')
          : new Date().toLocaleDateString('en-CA')

        const items: NormalizedSaleItem[] = []
        for (const li of order.lineItems?.elements ?? []) {
          const name = li.item?.name ?? li.name
          if (!name) continue
          items.push({
            sale_date: saleDate,
            raw_item_name: name as string,
            quantity_sold: typeof li.unitQty === 'number' ? li.unitQty / 1000 : 1,
            gross_sales: typeof li.price === 'number' ? li.price / 100 : null,
          })
        }

        if (items.length > 0) {
          const count = await importPosItemsToSupabase('clover', saleDate, saleDate, items, conn.business_id)
          await logPosSync('clover', saleDate, saleDate, 'success', count, conn.business_id)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'unknown'
        const saleDate = new Date().toLocaleDateString('en-CA')
        await logPosSync('clover', saleDate, saleDate, 'error', 0, conn.business_id, msg)
      }
    }
  }

  return NextResponse.json({ received: true })
}
