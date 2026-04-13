import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export interface PerformanceData {
  total_revenue:            number | null
  total_covers:             number | null
  covers_source:            'exact' | 'none'
  total_items_sold:         number
  transaction_count:        number
  transaction_count_source: 'exact' | 'approx'
  avg_spend_per_guest:      number | null
  avg_check:                number | null
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { searchParams } = new URL(req.url)
    const periodStart = searchParams.get('period_start')
    const periodEnd   = searchParams.get('period_end')
    const shiftStart  = searchParams.get('shift_start')
    const shiftEnd    = searchParams.get('shift_end')

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
    }

    const isShiftMode = !!(shiftStart && shiftEnd)

    let query = supabase
      .from('sales_transactions')
      .select('quantity_sold, gross_sales, guest_count, check_id')
      .eq('business_id', businessId)
      .not('menu_item_id', 'is', null)

    if (isShiftMode) {
      // Shift mode: only count rows that have a precise timestamp — date-only rows
      // (CSV imports without sale_timestamp) cannot be attributed to a specific shift
      // and must be excluded to avoid all shifts showing identical full-day totals.
      query = query
        .not('sale_timestamp', 'is', null)
        .gte('sale_timestamp', shiftStart)
        .lte('sale_timestamp', shiftEnd)
    } else {
      query = query.gte('sale_date', periodStart).lte('sale_date', periodEnd)
    }

    const { data: rows, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows || rows.length === 0) {
      return NextResponse.json<PerformanceData>({
        total_revenue: null, total_covers: null, covers_source: 'none',
        total_items_sold: 0, transaction_count: 0, transaction_count_source: 'approx',
        avg_spend_per_guest: null, avg_check: null,
      })
    }

    let totalRevenue    = 0
    let hasRevenue      = false
    let totalCovers     = 0
    let hasCovers       = false
    let totalItems      = 0
    const checkIds      = new Set<string>()
    let hasCheckIds     = false

    for (const row of rows) {
      totalItems += row.quantity_sold ?? 0
      if (row.gross_sales != null) { totalRevenue += row.gross_sales; hasRevenue = true }
      if (row.guest_count  != null && row.guest_count > 0) { totalCovers += row.guest_count; hasCovers = true }
      if (row.check_id) { checkIds.add(row.check_id); hasCheckIds = true }
    }

    const revenue           = hasRevenue ? totalRevenue : null
    const covers            = hasCovers  ? totalCovers  : null
    const coversSource      = hasCovers  ? 'exact'      : 'none'
    const txCount           = hasCheckIds ? checkIds.size : rows.length
    const txCountSource     = hasCheckIds ? 'exact' : 'approx'
    const avgSpendPerGuest  = revenue != null && covers != null && covers > 0 ? revenue / covers : null
    const avgCheck          = revenue != null && txCount > 0 ? revenue / txCount : null

    return NextResponse.json<PerformanceData>({
      total_revenue:            revenue,
      total_covers:             covers,
      covers_source:            coversSource,
      total_items_sold:         totalItems,
      transaction_count:        txCount,
      transaction_count_source: txCountSource,
      avg_spend_per_guest:      avgSpendPerGuest,
      avg_check:                avgCheck,
    })
  } catch (e) { return authErrorResponse(e) }
}
