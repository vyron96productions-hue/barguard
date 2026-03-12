import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'
import type { NormalizedSaleItem } from '@/lib/pos/types'

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

  // Check we haven't already processed this order
  const { data: existing } = await adminSupabase
    .from('pos_webhook_events')
    .select('id')
    .eq('provider', 'square')
    .eq('external_id', order_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Mark as processed before fetching (idempotency)
  await adminSupabase.from('pos_webhook_events').insert({
    business_id: conn.business_id,
    provider: 'square',
    external_id: order_id,
  })

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
