import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Check if user already has a business
  const { data: ub } = await supabase
    .from('user_businesses')
    .select('business_id')
    .eq('user_id', data.user.id)
    .single()

  if (!ub) {
    // New Google/OAuth user — create a business for them
    const displayName =
      (data.user.user_metadata?.full_name as string | undefined) ||
      (data.user.user_metadata?.name as string | undefined) ||
      data.user.email?.split('@')[0] ||
      'My Bar'

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: business } = await adminSupabase
      .from('businesses')
      .insert({ name: displayName, contact_email: data.user.email, trial_ends_at: trialEndsAt })
      .select()
      .single()

    if (business) {
      await adminSupabase
        .from('user_businesses')
        .insert({ user_id: data.user.id, business_id: business.id, role: 'owner' })
    }

    // Send new users to profile to set their bar name
    return NextResponse.redirect(`${origin}/profile?new=1`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
