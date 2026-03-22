import type { NormalizedSaleItem, PosTokenResponse } from './types'

const BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com'

const CLIENT_ID     = process.env.SQUARE_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.SQUARE_CLIENT_SECRET ?? ''

export function getSquareAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ',
    redirect_uri: redirectUri,
    state,
    session: 'false',
  })
  return `${BASE_URL}/oauth2/authorize?${params}`
}

export async function exchangeSquareCode(code: string, redirectUri: string): Promise<PosTokenResponse> {
  const res = await fetch(`${BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-18' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Square token exchange failed')

  // Fetch merchant info to get a location
  const merchantRes = await fetch(`${BASE_URL}/v2/merchants/me`, {
    headers: { Authorization: `Bearer ${data.access_token}`, 'Square-Version': '2024-01-18' },
  })
  const merchantData = await merchantRes.json()
  const merchant = merchantData.merchant

  // Fetch first location
  const locRes = await fetch(`${BASE_URL}/v2/locations`, {
    headers: { Authorization: `Bearer ${data.access_token}`, 'Square-Version': '2024-01-18' },
  })
  const locData = await locRes.json()
  const location = locData.locations?.[0]

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_at ? undefined : undefined,
    merchant_id: merchant?.id ?? data.merchant_id,
    location_id: location?.id,
    location_name: location?.name ?? merchant?.business_name,
  }
}

export async function fetchSquareSales(
  accessToken: string,
  locationId: string,
  startDate: string,
  endDate: string
): Promise<NormalizedSaleItem[]> {
  const items: NormalizedSaleItem[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      location_ids: [locationId],
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: `${startDate}T00:00:00Z`,
              end_at:   `${endDate}T23:59:59Z`,
            },
          },
          state_filter: { states: ['COMPLETED'] },
        },
      },
      limit: 500,
    }
    if (cursor) body.cursor = cursor

    const res = await fetch(`${BASE_URL}/v2/orders/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.errors?.[0]?.detail ?? 'Square orders fetch failed')

    for (const order of data.orders ?? []) {
      const saleDate = (order.created_at as string).slice(0, 10)
      for (const li of order.line_items ?? []) {
        if (!li.name) continue
        const modifiers = Array.isArray(li.modifiers)
          ? (li.modifiers as any[]).map((m) => m.name).filter(Boolean) as string[]
          : null
        items.push({
          sale_date: saleDate,
          raw_item_name: li.name as string,
          quantity_sold: parseFloat(li.quantity ?? '1'),
          gross_sales: li.total_money?.amount != null
            ? (li.total_money.amount as number) / 100
            : null,
          modifiers: modifiers?.length ? modifiers : null,
        })
      }
    }
    cursor = data.cursor
  } while (cursor)

  return items
}
