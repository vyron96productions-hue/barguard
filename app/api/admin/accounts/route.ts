import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { adminSupabase } = await getAdminContext()

    // Get all auth users
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    const users = usersData?.users ?? []

    // Get all businesses with their user links
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: linksRaw } = await (adminSupabase as any)
      .from('user_businesses')
      .select('user_id, business_id, role, is_admin, businesses(id, name, plan, contact_email, created_at, stripe_subscription_id)')

    const links = (linksRaw ?? []) as Array<{
      user_id: string
      business_id: string
      role: string
      is_admin: boolean | null
      businesses: {
        id: string; name: string; plan: string; contact_email: string | null
        created_at: string; stripe_subscription_id: string | null
      } | null
    }>

    // Build account list
    const accounts = links.map((link) => {
      const biz = link.businesses
      const authUser = users.find((u) => u.id === link.user_id)
      const username = (authUser?.user_metadata?.username as string | undefined)
        ?? authUser?.email?.replace('@barguard.app', '')
        ?? null

      return {
        business_id: biz?.id,
        bar_name: biz?.name ?? 'Unknown',
        plan: biz?.plan ?? 'basic',
        contact_email: biz?.contact_email ?? null,
        created_at: biz?.created_at ?? authUser?.created_at,
        has_subscription: !!biz?.stripe_subscription_id,
        user_id: link.user_id,
        username,
        is_admin: link.is_admin ?? false,
        role: link.role,
      }
    })

    // Stats
    const stats = {
      total: accounts.length,
      legacy: accounts.filter((a) => a.plan === 'legacy').length,
      basic: accounts.filter((a) => a.plan === 'basic').length,
      pro: accounts.filter((a) => a.plan === 'pro').length,
      enterprise: accounts.filter((a) => a.plan === 'enterprise').length,
    }

    return NextResponse.json({ accounts, stats })
  } catch (e) {
    return authErrorResponse(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { adminSupabase } = await getAdminContext()
    const { business_id, plan, disabled } = await req.json()

    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (plan) updates.plan = plan
    if (typeof disabled === 'boolean') updates.disabled = disabled

    const { error } = await adminSupabase
      .from('businesses')
      .update(updates)
      .eq('id', business_id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
