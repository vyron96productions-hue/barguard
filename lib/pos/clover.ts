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
  return `${BASE_AUTH}/oauth/v2/authorize?${params}`
}

export async function exchangeCloverCode(
  code: string,
  merchantId: string
): Promise<PosTokenResponse> {
  const res = await fetch(`${BASE_AUTH}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(data.message ?? 'Clover token exchange failed')

  // Fetch merchant name
  let locationName = merchantId
  try {
    const mRes = await fetch(`${BASE_API}/v3/merchants/${merchantId}`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    const mData = await mRes.json()
    if (mData.name) locationName = mData.name
  } catch { /* non-fatal */ }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
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
    const params = new URLSearchParams({
      expand: 'lineItems',
      filter: `createdTime>=${startMs}&filter=createdTime<=${endMs}&filter=payType!=null`,
      limit: String(limit),
      offset: String(offset),
    })
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
        items.push({
          sale_date: saleDate,
          raw_item_name: name as string,
          quantity_sold: typeof li.unitQty === 'number' ? li.unitQty / 1000 : 1,
          gross_sales: typeof li.price === 'number' ? li.price / 100 : null,
        })
      }
    }

    if (orders.length < limit) break
    offset += limit
  }

  return items
}
