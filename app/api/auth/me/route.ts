import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, user, businessId, clientRole, isOwner } = await getAuthContext()

    const { data: ubRaw } = await supabase
      .from('user_businesses')
      .select('is_admin, businesses(name, plan, trial_ends_at)')
      .eq('user_id', user.id)
      .single()

    const ub = ubRaw as unknown as {
      is_admin: boolean
      businesses: { name: string; plan: string | null; trial_ends_at: string | null } | null
    } | null
    const biz = ub?.businesses

    const username = (user.user_metadata?.username as string | undefined)
      ?? user.email?.replace('@barguard.app', '')
      ?? user.email
      ?? null

    return NextResponse.json({
      user_email:    user.email,
      username,
      business_id:   businessId,
      business_name: biz?.name ?? null,
      plan:          biz?.plan ?? null,
      trial_ends_at: biz?.trial_ends_at ?? null,
      is_admin:      ub?.is_admin ?? false,  // internal BarGuard admin — unrelated to client_role
      client_role:   clientRole,
      is_owner:      isOwner,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
