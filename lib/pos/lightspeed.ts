import type { NormalizedSaleItem, PosTokenResponse } from './types'

// Lightspeed Restaurant K-Series API
const AUTH_URL   = 'https://api.lsk.lightspeed.app/oauth/authorize'
const TOKEN_URL  = 'https://auth.lsk-prod.app/realms/k-series/protocol/openid-connect/token'
const API_BASE   = 'https://api.lsk.lightspeed.app'

const CLIENT_ID     = process.env.LIGHTSPEED_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET ?? ''

export function getLightspeedAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'financial-api offline_access',
    redirect_uri: redirectUri,
    state,
  })
  return `${AUTH_URL}?${params}`
}

export async function exchangeLightspeedCode(
  code: string,
  redirectUri: string
): Promise<PosTokenResponse> {
  const encoded = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(data.error ?? 'Lightspeed token exchange failed')

  // Fetch business location to get location ID and name
  let locationId: string | undefined
  let locationName = 'Lightspeed'
  try {
    const locRes = await fetch(`${API_BASE}/v1/business-location`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (locRes.ok) {
      const locData = await locRes.json()
      const locations = Array.isArray(locData) ? locData : (locData.businessLocations ?? locData.data ?? [])
      if (locations.length > 0) {
        locationId = String(locations[0].id ?? locations[0].businessLocationId)
        locationName = locations[0].name ?? locationName
      }
    }
  } catch { /* non-fatal */ }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in ?? 1800,
    merchant_id: locationId,
    location_id: locationId,
    location_name: locationName,
  }
}

export async function refreshLightspeedToken(refreshToken: string): Promise<{ access_token: string }> {
  const encoded = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Lightspeed token refresh failed')
  return { access_token: data.access_token }
}

export async function fetchLightspeedSales(
  accessToken: string,
  businessLocationId: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<NormalizedSaleItem[]> {
  const result: NormalizedSaleItem[] = []
  let pageToken: string | null = null

  const from = `${startDate}T00:00:00.000Z`
  const to   = `${endDate}T23:59:59.999Z`

  do {
    const params = new URLSearchParams({ from, to })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(
      `${API_BASE}/f/v2/business-location/${businessLocationId}/sales?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) throw new Error(`Lightspeed sales fetch failed (${res.status})`)

    const data = await res.json()
    const sales: any[] = data.sales ?? []

    for (const sale of sales) {
      if (sale.cancelled) continue

      const saleDate = (sale.timeClosed ?? sale.timeOfOpening ?? startDate).slice(0, 10)
      const station = sale.deviceName ?? sale.ownerName ?? null

      for (const line of sale.salesLines ?? []) {
        const name = line.nameOverride ?? line.name
        if (!name) continue
        const qty = parseFloat(line.quantity ?? '1')
        if (qty <= 0) continue
        const grossSales = line.totalNetAmountWithTax != null
          ? parseFloat(line.totalNetAmountWithTax)
          : null

        result.push({
          sale_date: saleDate,
          raw_item_name: name,
          quantity_sold: qty,
          gross_sales: grossSales,
          station,
        })
      }
    }

    pageToken = data.nextPageToken ?? null
  } while (pageToken)

  return result
}
