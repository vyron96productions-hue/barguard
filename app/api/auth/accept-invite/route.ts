import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * GET /api/auth/accept-invite?token=<raw>
 * Public endpoint — returns just enough invite info to render the accept page.
 * Does not expose token_hash or internal IDs.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 })
  }

  const { data: invite, error } = await adminSupabase
    .from('business_user_invites')
    .select('id, email, client_role, expires_at, accepted_at, revoked_at, business_id, businesses(name)')
    .eq('token_hash', hashToken(token))
    .single()

  if (error || !invite) {
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 })
  }

  if (invite.revoked_at) {
    return NextResponse.json({ valid: false, reason: 'revoked' }, { status: 410 })
  }
  if (invite.accepted_at) {
    return NextResponse.json({ valid: false, reason: 'already_accepted' }, { status: 410 })
  }
  if (new Date(invite.expires_at) <= new Date()) {
    return NextResponse.json({ valid: false, reason: 'expired' }, { status: 410 })
  }

  const biz = invite.businesses as unknown as { name: string } | null

  return NextResponse.json({
    valid:         true,
    email:         invite.email,
    client_role:   invite.client_role,
    business_name: biz?.name ?? null,
    expires_at:    invite.expires_at,
  })
}

/**
 * POST /api/auth/accept-invite
 * Accepts an invite. Two modes:
 *
 * Mode 1 — existing account (user is already signed in):
 *   Body: { token: string }
 *   Validates email match, inserts membership.
 *
 * Mode 2 — new account creation (user has no BarGuard account):
 *   Body: { token: string, password: string }
 *   Creates account via admin API (email pre-confirmed), inserts membership.
 *   Client must then call supabase.auth.signInWithPassword() to get a session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body as { token?: string; password?: string }

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Validate the invite
    const { data: invite, error: inviteErr } = await adminSupabase
      .from('business_user_invites')
      .select('id, email, normalized_email, client_role, expires_at, accepted_at, revoked_at, business_id, invited_by_user_id, display_name')
      .eq('token_hash', hashToken(token))
      .single()

    if (inviteErr || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite link.' }, { status: 404 })
    }
    if (invite.revoked_at) {
      return NextResponse.json({ error: 'This invite has been revoked.' }, { status: 410 })
    }
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'This invite has already been accepted.' }, { status: 410 })
    }
    if (new Date(invite.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'This invite link has expired. Ask the bar owner to send a new one.' }, { status: 410 })
    }

    // ── Mode 1: signed-in user accepting invite ───────────────────────────
    if (!password) {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'You must be signed in to accept this invite.', needs_auth: true }, { status: 401 })
      }

      // Email must match the invite exactly
      if (user.email?.toLowerCase().trim() !== invite.normalized_email) {
        return NextResponse.json({
          error: `This invite was sent to ${invite.email}. Please sign in with that account.`,
        }, { status: 403 })
      }

      // Check if user already belongs to a business
      const { data: existingMembership } = await adminSupabase
        .from('user_businesses')
        .select('business_id, membership_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .single()

      if (existingMembership) {
        if (existingMembership.business_id === invite.business_id) {
          // Already a member — mark invite accepted and return success
          await adminSupabase
            .from('business_user_invites')
            .update({ accepted_at: new Date().toISOString(), invitee_user_id: user.id })
            .eq('id', invite.id)
          return NextResponse.json({ ok: true, already_member: true })
        }
        return NextResponse.json({
          error: 'Your account already belongs to another bar. Multi-business membership is not supported yet.',
        }, { status: 409 })
      }

      // Insert membership
      await insertMembership(user.id, invite)

      // Ensure metadata is correct (email_verified + onboarding_complete)
      await adminSupabase.auth.admin.updateUserById(user.id, {
        app_metadata:  { email_verified: true },
        user_metadata: { onboarding_complete: true },
      })

      return NextResponse.json({ ok: true })
    }

    // ── Mode 2: new account creation ─────────────────────────────────────
    // Invitee doesn't have an account yet. Create one via admin API so the email
    // is pre-confirmed — no separate confirmation email loop.
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    // Check if an account with this email already exists
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase().trim() === invite.normalized_email
    )

    let userId: string

    if (existingUser) {
      // Account exists but has no active membership — treat as Mode 1
      const { data: existingMembership } = await adminSupabase
        .from('user_businesses')
        .select('business_id, membership_status')
        .eq('user_id', existingUser.id)
        .eq('membership_status', 'active')
        .single()

      if (existingMembership && existingMembership.business_id !== invite.business_id) {
        return NextResponse.json({
          error: 'An account with this email already exists and belongs to another bar.',
        }, { status: 409 })
      }

      userId = existingUser.id

      if (existingMembership?.business_id === invite.business_id) {
        // Already a member — just mark the invite accepted
        await adminSupabase
          .from('business_user_invites')
          .update({ accepted_at: new Date().toISOString(), invitee_user_id: userId })
          .eq('id', invite.id)
        // Return email so client can sign in
        return NextResponse.json({ ok: true, email: invite.email, already_member: true })
      }
    } else {
      // Create the account — email_confirm: true skips the Supabase confirmation email
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email:         invite.email,
        password,
        email_confirm: true,
        app_metadata:  { email_verified: true },
        user_metadata: { onboarding_complete: true },
      })

      if (createErr || !newUser?.user) {
        return NextResponse.json({ error: createErr?.message ?? 'Failed to create account.' }, { status: 500 })
      }

      userId = newUser.user.id
    }

    await insertMembership(userId, invite)

    // Return the email so the client can call signInWithPassword() to get a session
    return NextResponse.json({ ok: true, email: invite.email })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function insertMembership(
  userId: string,
  invite: {
    id: string
    business_id: string
    client_role: string
    invited_by_user_id: string
    email: string
    display_name?: string | null
  }
) {
  // Use adminSupabase (service role) to bypass the ub_insert RLS policy,
  // which only allows users to insert rows for themselves.
  await adminSupabase
    .from('user_businesses')
    .insert({
      user_id:            userId,
      business_id:        invite.business_id,
      role:               'member',
      client_role:        invite.client_role,
      membership_status:  'active',
      invited_by_user_id: invite.invited_by_user_id,
      joined_at:          new Date().toISOString(),
      email:              invite.email,
      display_name:       invite.display_name ?? null,
    })

  await adminSupabase
    .from('business_user_invites')
    .update({
      accepted_at:      new Date().toISOString(),
      invitee_user_id:  userId,
    })
    .eq('id', invite.id)
}
