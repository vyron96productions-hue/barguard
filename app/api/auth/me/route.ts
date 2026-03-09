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

    return NextResponse.json({
      user_email: user.email,
      business_id: businessId,
      business_name: biz?.name ?? null,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
