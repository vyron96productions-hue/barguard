import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export interface SalesLogItem {
  menu_item_id: string | null
  name: string           // menu_item.name if matched, else raw_item_name
  raw_name: string
  category: string | null
  item_type: string | null
  qty_sold: number
  gross_sales: number | null
  unit_price: number | null  // gross_sales / qty_sold, null if no revenue data
  matched: boolean
}

export interface SalesLogDay {
  date: string
  total_revenue: number | null
  total_qty: number
  items: SalesLogItem[]
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const dateStart   = searchParams.get('date_start')
    const dateEnd     = searchParams.get('date_end')
    const stationFilter = searchParams.get('station') // null = all, 'none' = unassigned

    if (!dateStart || !dateEnd) {
      return NextResponse.json({ error: 'date_start and date_end are required' }, { status: 400 })
    }

    type MenuItemJoin = { id: string; name: string; category: string | null; item_type: string | null }

    let query = supabase
      .from('sales_transactions')
      .select('sale_date, menu_item_id, raw_item_name, quantity_sold, gross_sales, station, menu_item:menu_items(id, name, category, item_type)')
      .eq('business_id', businessId)
      .gte('sale_date', dateStart)
      .lte('sale_date', dateEnd)
      .order('sale_date', { ascending: false })

    if (stationFilter === 'none') {
      query = query.is('station', null)
    } else if (stationFilter) {
      query = query.eq('station', stationFilter)
    }

    const { data: rawRows, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (rawRows ?? []) as unknown as Array<{
      sale_date: string
      menu_item_id: string | null
      raw_item_name: string
      quantity_sold: number
      gross_sales: number | null
      station: string | null
      menu_item: MenuItemJoin | null
    }>

    // Collect available stations across all rows (before station filter for use by UI)
    // We always return the station list from a separate unfiltered pass — but for simplicity
    // we return it from the filtered rows + note: UI fetches stations separately if needed.
    // Here we derive it from the raw result for the date range (ignoring stationFilter).
    const stationSet = new Set<string>()
    for (const row of rows) {
      if (row.station) stationSet.add(row.station)
    }

    // Aggregate: group by date → by menu_item_id (or raw_item_name for unmatched)
    const dayMap = new Map<string, Map<string, SalesLogItem>>()

    for (const row of rows) {
      const date = row.sale_date
      if (!dayMap.has(date)) dayMap.set(date, new Map())
      const itemMap = dayMap.get(date)!

      // Key: menu_item_id if matched, else raw_item_name
      const key = row.menu_item_id ?? `raw::${row.raw_item_name}`
      const mi = row.menu_item

      if (!itemMap.has(key)) {
        itemMap.set(key, {
          menu_item_id: row.menu_item_id,
          name: mi?.name ?? row.raw_item_name,
          raw_name: row.raw_item_name,
          category: mi?.category ?? null,
          item_type: mi?.item_type ?? null,
          qty_sold: 0,
          gross_sales: null,
          unit_price: null,
          matched: !!row.menu_item_id,
        })
      }

      const entry = itemMap.get(key)!
      entry.qty_sold += row.quantity_sold ?? 0
      if (row.gross_sales != null) {
        entry.gross_sales = (entry.gross_sales ?? 0) + row.gross_sales
      }
    }

    // Build response sorted by qty_sold desc per day
    const days: SalesLogDay[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, itemMap]) => {
        const items = Array.from(itemMap.values())
          .map((item) => ({
            ...item,
            unit_price: item.gross_sales != null && item.qty_sold > 0
              ? item.gross_sales / item.qty_sold
              : null,
          }))
          .sort((a, b) => b.qty_sold - a.qty_sold)

        const totalRevenue = items.some((i) => i.gross_sales != null)
          ? items.reduce((s, i) => s + (i.gross_sales ?? 0), 0)
          : null
        const totalQty = items.reduce((s, i) => s + i.qty_sold, 0)

        return { date, total_revenue: totalRevenue, total_qty: totalQty, items }
      })

    return NextResponse.json({ days, stations: Array.from(stationSet).sort() })
  } catch (e) { return authErrorResponse(e) }
}
