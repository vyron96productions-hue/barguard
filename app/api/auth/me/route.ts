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
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
