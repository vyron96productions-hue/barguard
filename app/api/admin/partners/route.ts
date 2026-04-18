import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { authErrorResponse } from '@/lib/auth'

// GET /api/admin/partners — list all partners with merchant counts
export async function GET() {
  try {
    const { adminSupabase } = await getAdminContext()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partners, error } = await (adminSupabase as any)
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Merchant counts per partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: merchantCounts } = await (adminSupabase as any)
      .from('businesses')
      .select('partner_id, plan')
      .not('partner_id', 'is', null)

    const countMap: Record<string, { total: number; active: number; mrr: number }> = {}
    const PLAN_MRR: Record<string, number> = { basic: 129, pro: 249, enterprise: 449, legacy: 0 }

    for (const biz of merchantCounts ?? []) {
      if (!biz.partner_id) continue
      if (!countMap[biz.partner_id]) countMap[biz.partner_id] = { total: 0, active: 0, mrr: 0 }
      countMap[biz.partner_id].total++
      const mrr = PLAN_MRR[biz.plan] ?? 0
      if (mrr > 0) {
        countMap[biz.partner_id].active++
        countMap[biz.partner_id].mrr += mrr
      }
    }

    const result = (partners ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      merchant_count: countMap[p.id as string]?.total ?? 0,
      active_merchant_count: countMap[p.id as string]?.active ?? 0,
      mrr: countMap[p.id as string]?.mrr ?? 0,
    }))

    const stats = {
      total_partners: result.length,
      active_partners: result.filter((p: Record<string, unknown>) => p.status === 'active').length,
      total_merchants: Object.values(countMap).reduce((s, c) => s + c.total, 0),
    }

    return NextResponse.json({ partners: result, stats })
  } catch (e) {
    return authErrorResponse(e)
  }
}

// POST /api/admin/partners — create a new partner
export async function POST(req: NextRequest) {
  try {
    const { adminSupabase } = await getAdminContext()
    const body = await req.json()
    const { name, contact_name, email, phone, partner_code, pricing_type, revenue_share_pct, wholesale_price, notes } = body

    if (!name || !contact_name || !email || !partner_code) {
      return NextResponse.json({ error: 'name, contact_name, email, and partner_code are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase as any)
      .from('partners')
      .insert({
        name: name.trim(),
        contact_name: contact_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        partner_code: partner_code.trim().toUpperCase(),
        status: 'pending',
        pricing_type: pricing_type || 'rev_share',
        revenue_share_pct: revenue_share_pct ?? null,
        wholesale_price: wholesale_price ?? null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email or partner code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return authErrorResponse(e)
  }
}

// PATCH /api/admin/partners — update a partner
export async function PATCH(req: NextRequest) {
  try {
    const { adminSupabase } = await getAdminContext()
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowed = ['name', 'contact_name', 'email', 'phone', 'partner_code', 'status', 'pricing_type', 'revenue_share_pct', 'wholesale_price', 'notes']
    for (const key of allowed) {
      if (key in fields) updates[key] = fields[key]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase as any)
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return authErrorResponse(e)
  }
}
