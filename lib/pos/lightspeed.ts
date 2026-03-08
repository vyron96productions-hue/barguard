import type { NormalizedSaleItem, PosTokenResponse } from './types'

// Lightspeed Restaurant (R-Series) OAuth
const AUTH_BASE = 'https://cloud.lightspeedapp.com'
const API_BASE  = 'https://api.lightspeedapp.com'

const CLIENT_ID     = process.env.LIGHTSPEED_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET ?? ''

export function getLightspeedAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'employee:all',
    redirect_uri: redirectUri,
    state,
  })
  return `${AUTH_BASE}/oauth/authorize.php?${params}`
}

export async function exchangeLightspeedCode(
  code: string,
  redirectUri: string
): Promise<PosTokenResponse> {
  const res = await fetch(`${AUTH_BASE}/oauth/access_token.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(data.error ?? 'Lightspeed token exchange failed')

  // Fetch account info
  let accountId: string | undefined
  let locationName = 'Lightspeed'
  try {
    const acctRes = await fetch(`${API_BASE}/API/Account.json`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    const acctData = await acctRes.json()
    accountId = acctData.Account?.accountID
    locationName = acctData.Account?.name ?? locationName
  } catch { /* non-fatal */ }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in ?? 1800,
    merchant_id: accountId,
    location_id: accountId,
    location_name: locationName,
  }
}

export async function refreshLightspeedToken(refreshToken: string): Promise<{ access_token: string }> {
  const res = await fetch(`${AUTH_BASE}/oauth/access_token.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Lightspeed token refresh failed')
  return { access_token: data.access_token }
}

export async function fetchLightspeedSales(
  accessToken: string,
  accountId: string,
  startDate: string,
  endDate: string
): Promise<NormalizedSaleItem[]> {
  const items: NormalizedSaleItem[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const params = new URLSearchParams({
      completed: 'true',
      limit: String(limit),
      offset: String(offset),
      load_relations: '["SaleLines"]',
    })
    params.append('timeStamp[]', `>,${startDate}`)
    params.append('timeStamp[]', `<,${endDate}T23:59:59`)
    const res = await fetch(
      `${API_BASE}/API/V3/Account/${accountId}/Sale.json?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.httpCode ?? 'Lightspeed sales fetch failed')

    const sales: any[] = Array.isArray(data.Sale) ? data.Sale
      : data.Sale ? [data.Sale] : []

    if (sales.length === 0) break

    for (const sale of sales) {
      const saleDate = (sale.timeStamp as string | undefined)?.slice(0, 10) ?? startDate
      const lines: any[] = Array.isArray(sale.SaleLines?.SaleLine)
        ? sale.SaleLines.SaleLine
        : sale.SaleLines?.SaleLine ? [sale.SaleLines.SaleLine] : []

      for (const line of lines) {
        const name = line.Item?.description ?? line.itemDescription
        if (!name) continue
        items.push({
          sale_date: saleDate,
          raw_item_name: name as string,
          quantity_sold: parseFloat(line.unitQuantity ?? '1'),
          gross_sales: line.calcTotal != null ? parseFloat(line.calcTotal) : null,
        })
      }
    }

    if (sales.length < limit) break
    offset += limit
  }

  return items
}
