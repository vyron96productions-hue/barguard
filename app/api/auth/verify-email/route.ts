import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  // Fetch user
  const { data: userData, error: userErr } = await adminSupabase.auth.admin.getUserById(uid)
  if (userErr || !userData.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  const meta = userData.user.app_metadata ?? {}
  const storedToken = meta.email_verification_token
  const expires = meta.email_verification_expires

  if (!storedToken || storedToken !== token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  if (expires && new Date(expires) < new Date()) {
    return NextResponse.redirect(`${origin}/check-email?expired=1`)
  }

  // Mark business as verified
  const { data: ub } = await adminSupabase
    .from('user_businesses')
    .select('business_id')
    .eq('user_id', uid)
    .single()

  if (ub) {
    await adminSupabase
      .from('businesses')
      .update({ email_verified: true } as never)
      .eq('id', ub.business_id)
  }

  // Update app_metadata — mark verified, clear token
  await adminSupabase.auth.admin.updateUserById(uid, {
    app_metadata: {
      ...meta,
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
    },
  })

  return NextResponse.redirect(`${origin}/welcome`)
}
