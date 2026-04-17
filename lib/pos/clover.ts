import type { NormalizedSaleItem, PosTokenResponse } from './types'

const BASE_AUTH = process.env.CLOVER_ENVIRONMENT === 'production'
  ? 'https://www.clover.com'
  : 'https://sandbox.dev.clover.com'

const BASE_API = process.env.CLOVER_ENVIRONMENT === 'production'
  ? 'https://api.clover.com'
  : 'https://apisandbox.dev.clover.com'

const APP_ID     = process.env.CLOVER_CLIENT_ID     ?? ''
const APP_SECRET = process.env.CLOVER_CLIENT_SECRET ?? ''

export function getCloverAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    state,
  })
  return `${BASE_AUTH}/oauth/authorize?${params}`
}

export async function exchangeCloverCode(
  code: string,
  merchantId: string,
  _redirectUri: string
): Promise<PosTokenResponse> {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('Clover OAuth credentials not configured (CLOVER_CLIENT_ID / CLOVER_CLIENT_SECRET missing)')
  }

  const tokenUrl = `${BASE_AUTH}/oauth/token`
  const params = new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, code })
  console.log('[clover] token exchange →', tokenUrl, { merchantId, env: process.env.CLOVER_ENVIRONMENT ?? 'sandbox' })

  const res = await fetch(`${tokenUrl}?${params}`, { method: 'GET' })
  const rawText = await res.text()
  let data: Record<string, unknown>
  try { data = JSON.parse(rawText) } catch { throw new Error(`Clover returned non-JSON (${res.status}): ${rawText.slice(0, 200)}`) }
  if (!res.ok || !data.access_token) {
    console.error('[clover] token exchange failed', { status: res.status, message: data.message })
    throw new Error((data.message as string) ?? `Clover token exchange failed (HTTP ${res.status})`)
  }

  // Fetch merchant name (non-fatal)
  let locationName = merchantId
  try {
    const mRes = await fetch(`${BASE_API}/v3/merchants/${merchantId}`, {
      headers: { Authorization: `Bearer ${data.access_token as string}` },
    })
    const mData = await mRes.json()
    if (mData.name) locationName = mData.name
    else console.warn('[clover] merchant lookup returned no name', { status: mRes.status, merchantId })
  } catch (e) {
    console.warn('[clover] merchant name fetch failed (non-fatal)', e instanceof Error ? e.message : e)
  }

  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string | undefined,
    expires_in: data.expires_in as number | undefined,
    merchant_id: merchantId,
    location_id: merchantId,
    location_name: locationName,
  }
}

export interface CloverCatalogItem {
  id: string
  name: string
  category: string | null
  suggestedUnit: string
}

function guessUnit(categoryName: string | null): string {
  const c = (categoryName ?? '').toLowerCase()
  if (/beer|lager|ale|stout|cider|seltzer|hard/.test(c)) return 'can'
  if (/keg|draft|draught/.test(c)) return 'keg'
  if (/wine/.test(c)) return 'bottle'
  return 'bottle'
}

export async function fetchCloverItems(
  accessToken: string,
  merchantId: string
): Promise<CloverCatalogItem[]> {
  const results: CloverCatalogItem[] = []
  let offset = 0
  const limit = 200

  while (true) {
    const params = new URLSearchParams({
      expand: 'categories',
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(
      `${BASE_API}/v3/merchants/${merchantId}/items?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? 'Clover items fetch failed')

    const elements: any[] = data.elements ?? []
    if (elements.length === 0) break

    for (const item of elements) {
      const categoryName: string | null = item.categories?.elements?.[0]?.name ?? null
      results.push({
        id: item.id as string,
        name: item.name as string,
        category: categoryName,
        suggestedUnit: guessUnit(categoryName),
      })
    }

    if (elements.length < limit) break
    offset += limit
  }

  return results
}

export async function fetchCloverSales(
  accessToken: string,
  merchantId: string,
  startDate: string,
  endDate: string
): Promise<NormalizedSaleItem[]> {
  const items: NormalizedSaleItem[] = []

  // Clover uses epoch milliseconds for filtering
  const startMs = new Date(`${startDate}T00:00:00Z`).getTime()
  const endMs   = new Date(`${endDate}T23:59:59Z`).getTime()

  let offset = 0
  const limit = 100

  while (true) {
    const params = new URLSearchParams({ expand: 'lineItems', limit: String(limit), offset: String(offset) })
    params.append('filter', `createdTime>=${startMs}`)
    params.append('filter', `createdTime<=${endMs}`)
    params.append('filter', 'payType!=null')
    const res = await fetch(
      `${BASE_API}/v3/merchants/${merchantId}/orders?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? 'Clover orders fetch failed')

    const orders: any[] = data.elements ?? []
    if (orders.length === 0) break

    for (const order of orders) {
      const saleDate = order.createdTime
        ? new Date(order.createdTime as number).toISOString().slice(0, 10)
        : startDate

      for (const li of order.lineItems?.elements ?? []) {
        const name = li.item?.name ?? li.name
        if (!name) continue
        const modifiers = Array.isArray(li.modifications?.elements)
          ? (li.modifications.elements as any[]).map((m) => m.modifier?.name ?? m.name).filter(Boolean) as string[]
          : null
        items.push({
          sale_date: saleDate,
          raw_item_name: name as string,
          quantity_sold: typeof li.unitQty === 'number' ? li.unitQty / 1000 : 1,
          gross_sales: typeof li.price === 'number' ? li.price / 100 : null,
          modifiers: modifiers?.length ? modifiers : null,
        })
      }
    }

    if (orders.length < limit) break
    offset += limit
  }

  return items
}
