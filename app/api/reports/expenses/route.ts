import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

function isoWeekStart(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  return mon.toLocaleDateString('en-CA')
}

function monthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA')
}

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const today     = todayLocal()
    const weekStart = isoWeekStart()
    const monStart  = monthStart()

    // All receipts this month (covers week + month queries)
    const { data: receipts } = await supabase
      .from('expense_receipts')
      .select('id, vendor_name, receipt_date, total_amount, created_at')
      .eq('business_id', businessId)
      .gte('receipt_date', monStart)
      .lte('receipt_date', today)
      .order('receipt_date', { ascending: false })

    const all = receipts ?? []
    const thisWeek  = all.filter((r) => r.receipt_date >= weekStart)
    const thisMonth = all

    const total_this_week  = thisWeek.reduce((s, r) => s + Number(r.total_amount), 0)
    const total_this_month = thisMonth.reduce((s, r) => s + Number(r.total_amount), 0)

    // Category breakdown (all time past 90 days for analytics)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const since90 = ninetyDaysAgo.toLocaleDateString('en-CA')

    const { data: items } = await supabase
      .from('expense_receipt_items')
      .select('line_total, expense_category:expense_categories(id, name)')
      .eq('business_id', businessId)
      .gte('created_at', since90 + 'T00:00:00Z')

    // By category
    const catMap = new Map<string, { total: number; count: number }>()
    for (const item of items ?? []) {
      const catName = (item.expense_category as unknown as { name: string } | null)?.name ?? 'Uncategorized'
      const amt = Number(item.line_total ?? 0)
      const existing = catMap.get(catName) ?? { total: 0, count: 0 }
      catMap.set(catName, { total: existing.total + amt, count: existing.count + 1 })
    }

    const by_category = [...catMap.entries()]
      .map(([category_name, v]) => ({ category_name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total)

    const top_category = by_category[0]?.category_name ?? null

    // By vendor (this month)
    const vendorMap = new Map<string, { total: number; count: number }>()
    for (const r of thisMonth) {
      const key = r.vendor_name ?? 'Unknown'
      const existing = vendorMap.get(key) ?? { total: 0, count: 0 }
      vendorMap.set(key, { total: existing.total + Number(r.total_amount), count: existing.count + 1 })
    }

    const by_vendor = [...vendorMap.entries()]
      .map(([vendor_name, v]) => ({ vendor_name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    const recent = all.slice(0, 8).map((r) => ({
      id:           r.id,
      vendor_name:  r.vendor_name,
      receipt_date: r.receipt_date,
      total_amount: r.total_amount,
    }))

    return NextResponse.json({
      total_this_week,
      total_this_month,
      receipt_count_this_month: thisMonth.length,
      top_category,
      by_category,
      by_vendor,
      recent,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
