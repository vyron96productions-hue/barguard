import type { NormalizedSaleItem, PosTokenResponse } from './types'

const BASE_URL = 'https://ws-api.toasttab.com'

// Toast uses client_credentials — no browser OAuth redirect needed.
// The user provides clientId + clientSecret + restaurantGuid directly.
export async function connectToast(
  clientId: string,
  clientSecret: string,
  restaurantGuid: string
): Promise<PosTokenResponse> {
  const res = await fetch(`${BASE_URL}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.token?.accessToken) {
    throw new Error(data.message ?? 'Toast authentication failed')
  }

  // Validate the restaurant GUID by fetching restaurant info
  const infoRes = await fetch(`${BASE_URL}/restaurants/v1/groups`, {
    headers: {
      Authorization: `Bearer ${data.token.accessToken}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
    },
  })

  let locationName = restaurantGuid
  if (infoRes.ok) {
    const info = await infoRes.json()
    locationName = info?.[0]?.name ?? restaurantGuid
  }

  return {
    access_token: data.token.accessToken,
    refresh_token: data.token.refreshToken,
    expires_in: data.token.expiresIn,
    merchant_id: clientId,
    location_id: restaurantGuid,
    location_name: locationName,
  }
}

export async function refreshToastToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ access_token: string; expires_in?: number }> {
  const res = await fetch(`${BASE_URL}/authentication/v1/authentication/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, refreshToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Toast token refresh failed')
  return { access_token: data.token.accessToken, expires_in: data.token.expiresIn }
}

export async function fetchToastSales(
  accessToken: string,
  restaurantGuid: string,
  startDate: string,
  endDate: string
): Promise<NormalizedSaleItem[]> {
  const items: NormalizedSaleItem[] = []

  // Toast uses YYYYMMDD format for business dates
  const start = startDate.replace(/-/g, '')
  const end   = endDate.replace(/-/g, '')

  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      startDate: start,
      endDate: end,
      pageSize: String(pageSize),
      page: String(page),
    })
    const res = await fetch(`${BASE_URL}/orders/v2/ordersBulk?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    })
    if (!res.ok) throw new Error('Toast orders fetch failed')
    const orders: unknown[] = await res.json()
    if (!Array.isArray(orders) || orders.length === 0) break

    for (const order of orders as any[]) {
      const saleDate = (order.businessDate as string | undefined)
        ? `${String(order.businessDate).slice(0, 4)}-${String(order.businessDate).slice(4, 6)}-${String(order.businessDate).slice(6, 8)}`
        : (order.openedDate as string | undefined)?.slice(0, 10) ?? startDate

      for (const check of order.checks ?? []) {
        for (const sel of check.selections ?? []) {
          if (!sel.displayName) continue
          items.push({
            sale_date: saleDate,
            raw_item_name: sel.displayName as string,
            quantity_sold: typeof sel.quantity === 'number' ? sel.quantity : 1,
            gross_sales: typeof sel.preDiscountPrice === 'number' ? sel.preDiscountPrice : null,
          })
        }
      }
    }

    if (orders.length < pageSize) break
    page++
  }

  return items
}
