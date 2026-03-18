import type { NormalizedSaleItem } from './types'

// Focus POS API — credential-based (Basic Auth)
// Base URL: https://focuslink.focuspos.com
// Auth: Base64(apiKey:apiSecret) in Authorization header
// venueKey identifies the location

function focusBase() {
  return 'https://focuslink.focuspos.com'
}

function focusHeaders(apiKey: string, apiSecret: string) {
  const encoded = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

// Verify credentials by fetching checks — returns venue name
export async function connectFocus(
  venueKey: string,
  apiKey: string,
  apiSecret: string
): Promise<{ location_name: string }> {
  const res = await fetch(`${focusBase()}/v3/stores/${venueKey}/pos/checks`, {
    headers: focusHeaders(apiKey, apiSecret),
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error('Invalid credentials — please check your Focus POS API key and secret')
  }
  if (!res.ok) {
    throw new Error(`Focus POS connection failed (${res.status})`)
  }

  // Try to get venue name from first check's owner field, fallback to venueKey
  const data = await res.json()
  const checks = Array.isArray(data) ? data : (data.results ?? [])
  const locationName = checks?.[0]?.owner ?? `Venue ${venueKey}`

  return { location_name: locationName }
}

// Fetch all closed checks for a date range, return normalized sale items
export async function fetchFocusSales(
  venueKey: string,
  apiKey: string,
  apiSecret: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<NormalizedSaleItem[]> {
  const headers = focusHeaders(apiKey, apiSecret)
  const result: NormalizedSaleItem[] = []

  // Iterate each day in the range
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const businessDate = d.toISOString().slice(0, 10)

    const res = await fetch(
      `${focusBase()}/v3/stores/${venueKey}/pos/checks?businessDate=${businessDate}`,
      { headers }
    )

    if (!res.ok) continue  // skip days with errors, don't abort entire sync

    const data = await res.json()
    const checks = Array.isArray(data) ? data : (data.results ?? [])

    for (const check of checks) {
      // Skip open/unclosed checks
      if (check.open === true) continue

      const saleDate = check.businessDate?.slice(0, 10) ?? businessDate
      const station = check.owner ?? null

      for (const seat of check.seats ?? []) {
        for (const item of seat.items ?? []) {
          // Skip modifiers (level > 0) and zero/negative quantities
          if ((item.level ?? 0) > 0) continue
          const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity ?? '1')
          if (!item.name || qty <= 0) continue

          const grossSales = typeof item.price === 'number' ? item.price * qty : null

          result.push({
            sale_date: saleDate,
            raw_item_name: item.name,
            quantity_sold: qty,
            gross_sales: grossSales,
            station,
          })
        }
      }
    }
  }

  return result
}
