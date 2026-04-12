import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  // invite_token is passed through if the user started the OAuth flow from /accept-invite
  const inviteToken = searchParams.get('invite_token')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Check if user already has an active business membership
  const { data: ub } = await supabase
    .from('user_businesses')
    .select('business_id, role')
    .eq('user_id', data.user.id)
    .eq('membership_status', 'active')
    .single()

  if (ub) {
    // Already a member — go to the app
    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── STEP 1: Check for a pending invite FIRST ─────────────────────────────
  // This must run before the contact_email fallback, otherwise an invited user
  // whose email matches a business's contact_email could be incorrectly promoted to owner.
  const userEmail = data.user.email ?? ''

  if (userEmail) {
    let inviteToAccept: { id: string; business_id: string; client_role: string } | null = null

    // If an invite token was threaded through the OAuth flow, prefer that exact invite
    if (inviteToken) {
      const tokenHash = createHash('sha256').update(inviteToken).digest('hex')
      const { data: exactInvite } = await adminSupabase
        .from('business_user_invites')
        .select('id, business_id, client_role, normalized_email, expires_at')
        .eq('token_hash', tokenHash)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .single()

      if (
        exactInvite &&
        exactInvite.normalized_email === userEmail.toLowerCase().trim() &&
        new Date(exactInvite.expires_at) > new Date()
      ) {
        inviteToAccept = exactInvite
      }
    }

    // Fallback: look for any open invite for this email
    if (!inviteToAccept) {
      const { data: openInvites } = await adminSupabase
        .from('business_user_invites')
        .select('id, business_id, client_role, expires_at')
        .eq('normalized_email', userEmail.toLowerCase().trim())
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())

      if (openInvites && openInvites.length === 1) {
        inviteToAccept = openInvites[0]
      }
      // If multiple open invites exist, we cannot auto-select — fall through to owner flow
    }

    if (inviteToAccept) {
      // Attach this user to the invited business with the invited role
      await adminSupabase
        .from('user_businesses')
        .insert({
          user_id:            data.user.id,
          business_id:        inviteToAccept.business_id,
          role:               'member',
          client_role:        inviteToAccept.client_role,
          membership_status:  'active',
          invited_by_user_id: null, // set on the invite row itself
          joined_at:          new Date().toISOString(),
        })

      // Mark invite accepted
      await adminSupabase
        .from('business_user_invites')
        .update({ accepted_at: new Date().toISOString(), invitee_user_id: data.user.id })
        .eq('id', inviteToAccept.id)

      // Mark email verified + onboarding complete so middleware lets them through
      await adminSupabase.auth.admin.updateUserById(data.user.id, {
        app_metadata:  { email_verified: true },
        user_metadata: { onboarding_complete: true },
      })

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // ── STEP 2: Check if a bar already registered with this Gmail address ────
  // Only runs if no invite was found above.
  const { data: existingBiz } = await adminSupabase
    .from('businesses')
    .select('id')
    .eq('contact_email', userEmail)
    .maybeSingle()

  if (existingBiz) {
    // Link this Google login to the existing bar — no second account created
    await adminSupabase
      .from('user_businesses')
      .insert({
        user_id:           data.user.id,
        business_id:       existingBiz.id,
        role:              'owner',
        client_role:       'admin',
        membership_status: 'active',
      })
    await adminSupabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: { email_verified: true },
    })
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // ── STEP 3: Genuinely new Google user — create a business for them ────────
  const displayName =
    (data.user.user_metadata?.full_name as string | undefined) ||
    (data.user.user_metadata?.name as string | undefined) ||
    userEmail.split('@')[0] ||
    'My Bar'

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: business } = await adminSupabase
    .from('businesses')
    .insert({ name: displayName, contact_email: userEmail, trial_ends_at: trialEndsAt, email_verified: true })
    .select()
    .single()

  if (business) {
    await adminSupabase
      .from('user_businesses')
      .insert({
        user_id:           data.user.id,
        business_id:       business.id,
        role:              'owner',
        client_role:       'admin',
        membership_status: 'active',
      })
  }

  await adminSupabase.auth.admin.updateUserById(data.user.id, {
    app_metadata: { email_verified: true },
  })

  return NextResponse.redirect(`${origin}/profile?new=1`)
}
