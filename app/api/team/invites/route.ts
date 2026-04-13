import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'
import { logTeamActivity } from '@/lib/team-activity'
import { Resend } from 'resend'
import { randomBytes, createHash } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/team/invites
 * Creates an invite for a new team member and sends the invite email.
 * Admin/owner only.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { businessId, user } = ctx
    const { email, client_role, display_name } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const validRoles = ['admin', 'manager', 'employee']
    if (!validRoles.includes(client_role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, manager, or employee.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (!normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if this person is already an active member
    const { data: existingMember } = await adminSupabase
      .from('user_businesses')
      .select('id')
      .eq('business_id', businessId)
      .eq('membership_status', 'active')
      .limit(1)

    // We can't easily check by email here without joining to auth.users (service-role only).
    // The unique partial index on business_user_invites will catch duplicate open invites.

    // Generate a cryptographically random token
    const rawToken  = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Get the business name for the email
    const { data: biz } = await adminSupabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    // Insert invite row — unique index prevents double-inviting the same email
    const { data: invite, error: insertErr } = await adminSupabase
      .from('business_user_invites')
      .insert({
        business_id:        businessId,
        email:              email.trim(),
        normalized_email:   normalizedEmail,
        client_role,
        display_name:       display_name?.trim() || null,
        token_hash:         tokenHash,
        invited_by_user_id: user.id,
        expires_at:         expiresAt,
      })
      .select('id')
      .single()

    if (insertErr) {
      // Unique constraint violation = open invite already exists for this email
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'An open invite already exists for this email. Revoke it first to resend.' },
          { status: 409 }
        )
      }
      throw insertErr
    }

    const origin     = req.headers.get('origin') || 'https://barguard.app'
    const inviteLink = `${origin}/accept-invite?token=${rawToken}`
    const roleLabel  = { admin: 'Admin', manager: 'Manager', employee: 'Employee' }[client_role as string] ?? client_role

    await resend.emails.send({
      from:    'BarGuard <noreply@barguard.app>',
      to:      email.trim(),
      subject: `You've been invited to join ${biz?.name ?? 'a bar'} on BarGuard`,
      html:    buildInviteEmail(inviteLink, biz?.name ?? 'your bar', roleLabel),
    })

    // Log the invite action (fire-and-forget)
    const { data: inviterUb } = await adminSupabase
      .from('user_businesses')
      .select('display_name')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()
    logTeamActivity(businessId, user.id, inviterUb?.display_name ?? null, 'member_invited', {
      invited_email: email.trim(),
      invited_name:  display_name?.trim() || null,
      role:          client_role,
    })

    return NextResponse.json({ ok: true, invite_id: invite.id })
  } catch (e) {
    return authErrorResponse(e, 'POST /api/team/invites')
  }
}

function buildInviteEmail(inviteLink: string, businessName: string, roleLabel: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:40px;height:40px;background:#f59e0b;border-radius:10px;font-weight:900;font-size:12px;color:#0f172a;display:flex;align-items:center;justify-content:center">BG</div>
        <span style="font-size:18px;font-weight:bold;color:#f1f5f9">BarGuard</span>
      </div>
      <h2 style="color:#f1f5f9;margin:0 0 8px">You're invited to join ${businessName}</h2>
      <p style="color:#94a3b8;margin:0 0 8px">
        You've been invited to access <strong style="color:#e2e8f0">${businessName}</strong> on BarGuard as a
        <strong style="color:#f59e0b"> ${roleLabel}</strong>.
      </p>
      <p style="color:#94a3b8;margin:0 0 24px">Click the button below to accept your invite and set up your account.</p>
      <a href="${inviteLink}"
         style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
        Accept Invite
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">
        This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  `
}
