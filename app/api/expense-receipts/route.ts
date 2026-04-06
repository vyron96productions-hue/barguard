import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const categoryId = searchParams.get('category_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabase
      .from('expense_receipts')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('receipt_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dateFrom) query = query.gte('receipt_date', dateFrom)
    if (dateTo) query = query.lte('receipt_date', dateTo)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If filtering by category, we need to join via items
    // For simplicity, return receipts and let client filter — or do a subquery
    let filtered = data ?? []
    if (categoryId) {
      const { data: matchingReceiptIds } = await supabase
        .from('expense_receipt_items')
        .select('receipt_id')
        .eq('business_id', businessId)
        .eq('expense_category_id', categoryId)
      const ids = new Set((matchingReceiptIds ?? []).map((r) => r.receipt_id))
      filtered = filtered.filter((r) => ids.has(r.id))
    }

    return NextResponse.json({ receipts: filtered, total: count ?? 0 })
  } catch (e) {
    return authErrorResponse(e)
  }
}
