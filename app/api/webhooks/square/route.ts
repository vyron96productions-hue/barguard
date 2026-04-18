import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'
import type { NormalizedSaleItem } from '@/lib/pos/types'
import { logger } from '@/lib/logger'

const ROUTE = 'webhooks/square'

const SQUARE_WEBHOOK_SIG_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ''

const BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com'

// Square signature verification:
// HMAC-SHA256 of (webhookUrl + rawBody) using the signature key, base64 encoded
function verifySquareSignature(
  rawBody: string,
  signatureHeader: string,
  webhookUrl: string
): boolean {
  if (!SQUARE_WEBHOOK_SIG_KEY) return false
  const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIG_KEY)
  hmac.update(webhookUrl + rawBody)
  const expected = hmac.digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
}

async function fetchSquareOrder(accessToken: string, orderId: string) {
  const res = await fetch(`${BASE_URL}/v2/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2024-01-18',
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.detail ?? 'Failed to fetch order')
  return data.order
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get('x-square-hmacsha256-signature') ?? ''

  // Build the full webhook URL for signature verification
  const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/square`

  if (!verifySquareSignature(rawBody, signatureHeader, webhookUrl)) {
    logger.warn(ROUTE, 'Signature verification failed', { webhookUrl, hasSignature: !!signatureHeader })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    merchant_id: string
    type: string
    data?: {
      object?: {
        order_updated?: {
          order_id: string
          location_id: string
          state: string
        }
      }
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only process completed orders
  if (event.type !== 'order.updated') {
    return NextResponse.json({ received: true })
  }

  const orderUpdated = event.data?.object?.order_updated
  if (!orderUpdated || orderUpdated.state !== 'COMPLETED') {
    return NextResponse.json({ received: true })
  }

  const { order_id, location_id } = orderUpdated
  const merchantId = event.merchant_id

  // Look up which business this merchant belongs to
  const { data: conn } = await adminSupabase
    .from('pos_connections')
    .select('business_id, access_token, location_id')
    .eq('pos_type', 'square')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .single()

  if (!conn) {
    // Not a connected merchant — ignore
    return NextResponse.json({ received: true })
  }

  // ── Idempotency guard — atomic INSERT wins; retries get 23505 and no-op ──
  // Uses order_id as the event key: process each completed order at most once.
  const { error: dedupError } = await adminSupabase
    .from('webhook_idempotency_keys')
    .insert({ provider: 'square', event_id: order_id })

  if (dedupError?.code === '23505') {
    return NextResponse.json({ received: true }) // already processed
  }
  if (dedupError) {
    // Non-duplicate error (e.g. 42P01 = table missing, network issue).
    // Log prominently but continue processing — a missed dedup is preferable to dropping a sale.
    logger.error(ROUTE, 'Dedup insert failed — continuing', { code: dedupError.code, error: dedupError.message, order_id })
  }

  try {
    const order = await fetchSquareOrder(conn.access_token, order_id)
    const saleDate = (order.created_at as string).slice(0, 10)

    // Use source name as station if available (e.g. "Square Point of Sale", "Square for Restaurants")
    const station: string | null = order.source?.name ?? null

    const items: NormalizedSaleItem[] = []
    for (const li of order.line_items ?? []) {
      if (!li.name) continue
      items.push({
        sale_date: saleDate,
        raw_item_name: li.name as string,
        quantity_sold: parseFloat(li.quantity ?? '1'),
        gross_sales: li.total_money?.amount != null
          ? (li.total_money.amount as number) / 100
          : null,
        station,
      })
    }

    if (items.length > 0) {
      const count = await importPosItemsToSupabase('square', saleDate, saleDate, items, conn.business_id)
      await logPosSync('square', saleDate, saleDate, 'success', count, conn.business_id)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    await logPosSync('square', orderUpdated.order_id.slice(0, 10), orderUpdated.order_id.slice(0, 10), 'error', 0, conn.business_id, msg)
  }

  return NextResponse.json({ received: true })
}
