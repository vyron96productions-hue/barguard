import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { authErrorResponse } from '@/lib/auth'

// GET /api/admin/partners/[id]/merchants — list merchants under a partner
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminSupabase } = await getAdminContext()
    const { id } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase as any)
      .from('businesses')
      .select('id, name, plan, contact_email, created_at, account_type, stripe_subscription_id')
      .eq('partner_id', id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return authErrorResponse(e)
  }
}

// POST /api/admin/partners/[id]/merchants — assign a merchant to this partner
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminSupabase } = await getAdminContext()
    const { id } = await params
    const { business_id } = await req.json()

    if (!business_id) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

    // Verify partner exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner } = await (adminSupabase as any).from('partners').select('id').eq('id', id).single()
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase as any)
      .from('businesses')
      .update({ partner_id: id, account_type: 'partner_managed' })
      .eq('id', business_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}

// DELETE /api/admin/partners/[id]/merchants?business_id=xxx — unassign merchant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminSupabase } = await getAdminContext()
    await params // consume params
    const { searchParams } = new URL(req.url)
    const business_id = searchParams.get('business_id')

    if (!business_id) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase as any)
      .from('businesses')
      .update({ partner_id: null, account_type: 'direct' })
      .eq('id', business_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
