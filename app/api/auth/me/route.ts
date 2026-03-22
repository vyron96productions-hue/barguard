import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, user, businessId } = await getAuthContext()

    const { data: biz } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ub } = await (supabase as any)
      .from('user_businesses')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    // Prefer stored username from metadata; fall back to email
    const username = (user.user_metadata?.username as string | undefined)
      ?? user.email?.replace('@barguard.app', '')
      ?? user.email
      ?? null

    return NextResponse.json({
      user_email: user.email,
      username,
      business_id: businessId,
      business_name: biz?.name ?? null,
      is_admin: (ub as { is_admin?: boolean } | null)?.is_admin ?? false,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
