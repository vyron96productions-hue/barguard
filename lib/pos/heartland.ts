import type { NormalizedSaleItem } from './types'

// Heartland Retail API — credential-based (no OAuth redirect)
// Customer generates an API key from their POS back-office:
// Main Menu → Integrations → API Key
// Base URL is account-specific: https://{subdomain}.retail.heartland.us/api/

function heartlandBase(subdomain: string) {
  return `https://${subdomain}.retail.heartland.us/api`
}

function heartlandHeaders(apiKey: string) {
  return {
    'Authorization': `Token token=${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

// Verify credentials by fetching account info
export async function connectHeartland(
  subdomain: string,
  apiKey: string
): Promise<{ location_name: string }> {
  const res = await fetch(`${heartlandBase(subdomain)}/locations`, {
    headers: heartlandHeaders(apiKey),
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error('Invalid API key — please check your Heartland credentials')
  }
  if (!res.ok) {
    throw new Error(`Heartland connection failed (${res.status})`)
  }

  const data = await res.json()
  const locations = Array.isArray(data) ? data : data.locations ?? []
  const locationName = locations?.[0]?.name ?? subdomain

  return { location_name: locationName }
}

// Fetch all completed tickets in date range and return normalized sale items
export async function fetchHeartlandSales(
  subdomain: string,
  apiKey: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<NormalizedSaleItem[]> {
  const headers = heartlandHeaders(apiKey)
  const base = heartlandBase(subdomain)

  // Step 1: page through all completed tickets in the date range
  const allTickets: any[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const params = new URLSearchParams({
      status: 'complete',
      completed_at_min: `${startDate}T00:00:00`,
      completed_at_max: `${endDate}T23:59:59`,
      per_page: String(perPage),
      page: String(page),
    })

    const res = await fetch(`${base}/tickets?${params}`, { headers })
    if (!res.ok) throw new Error(`Heartland tickets fetch failed (${res.status})`)

    const data = await res.json()
    const tickets = Array.isArray(data) ? data : data.tickets ?? []
    if (tickets.length === 0) break

    allTickets.push(...tickets)
    if (tickets.length < perPage) break
    page++
  }

  if (allTickets.length === 0) return []

  // Step 2: collect all unique item_ids across all ticket item lines
  const itemIdSet = new Set<number>()
  for (const ticket of allTickets) {
    for (const line of ticket.item_lines ?? []) {
      if (line.item_id) itemIdSet.add(line.item_id)
    }
  }

  // Step 3: fetch item names for all unique item IDs (batched)
  const itemNameMap = new Map<number, string>()
  const itemIds = Array.from(itemIdSet)

  // Fetch in batches of 50 to avoid query string length limits
  for (let i = 0; i < itemIds.length; i += 50) {
    const batch = itemIds.slice(i, i + 50)
    const params = new URLSearchParams()
    batch.forEach(id => params.append('id[]', String(id)))
    params.set('per_page', '50')

    try {
      const res = await fetch(`${base}/items?${params}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : data.items ?? []
        for (const item of items) {
          if (item.id && item.name) itemNameMap.set(item.id, item.name)
        }
      }
    } catch {
      // If item lookup fails, we fall back to item_id as the name below
    }
  }

  // Step 4: normalize to NormalizedSaleItem[]
  const result: NormalizedSaleItem[] = []

  for (const ticket of allTickets) {
    const saleDate = (ticket.completed_at ?? ticket.local_created_at ?? startDate).slice(0, 10)

    for (const line of ticket.item_lines ?? []) {
      const itemName = itemNameMap.get(line.item_id) ?? line.item_name ?? `Item #${line.item_id}`
      const qty = typeof line.qty === 'number' ? line.qty : parseFloat(line.qty ?? '1')
      const grossSales = typeof line.value === 'number' ? line.value : null

      if (!itemName || qty <= 0) continue

      result.push({
        sale_date: saleDate,
        raw_item_name: itemName,
        quantity_sold: qty,
        gross_sales: grossSales,
        station: ticket.station_id ? String(ticket.station_id) : null,
      })
    }
  }

  return result
}
