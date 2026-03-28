import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, user, businessId } = await getAuthContext()

    // Single query — join businesses + is_admin flag in one round-trip
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ub } = await (supabase as any)
      .from('user_businesses')
      .select('is_admin, businesses(name, plan, trial_ends_at)')
      .eq('user_id', user.id)
      .single()

    const biz = (ub as any)?.businesses

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
      is_admin:      (ub as { is_admin?: boolean } | null)?.is_admin ?? false,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
