import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { importPosItemsToSupabase, logPosSync } from '@/lib/pos/sync'
import type { NormalizedSaleItem } from '@/lib/pos/types'

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

  // Clover verification pings don't include a signature — let them through
  if (signatureHeader && !verifyCloverSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Respond to verification pings
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(rawBody) } catch { parsed = {} }
  if (parsed.verificationCode) {
    console.log('[clover-webhook] verificationCode:', parsed.verificationCode)
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

      // Idempotency check
      const { data: existing } = await adminSupabase
        .from('pos_webhook_events')
        .select('id')
        .eq('provider', 'clover')
        .eq('external_id', orderId)
        .maybeSingle()

      if (existing) continue

      // Mark as processing
      await adminSupabase.from('pos_webhook_events').insert({
        business_id: conn.business_id,
        provider: 'clover',
        external_id: orderId,
      })

      try {
        const order = await fetchCloverOrder(conn.access_token, merchantId, orderId)

        // Only process paid orders
        if (!order.payType) continue

        const saleDate = order.createdTime
          ? new Date(order.createdTime as number).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)

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
        const saleDate = new Date().toISOString().slice(0, 10)
        await logPosSync('clover', saleDate, saleDate, 'error', 0, conn.business_id, msg)
      }
    }
  }

  return NextResponse.json({ received: true })
}
