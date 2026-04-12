import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

/**
 * GET /api/team
 * Returns active members + pending invites for the business.
 * Admin/owner only.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { supabase, businessId } = ctx

    // Active members (excludes removed)
    const { data: members, error: membersErr } = await supabase
      .from('user_businesses')
      .select('id, user_id, role, client_role, joined_at, membership_status')
      .eq('business_id', businessId)
      .eq('membership_status', 'active')
      .order('joined_at')

    if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

    // We need the email for each member — it's in auth.users, accessible via admin client
    // but not via anon/user client. We return user_id and rely on the invite email stored
    // on accepted invites for display. For now return members as-is and enrich on the client.
    // Pending invites (open, not expired)
    const { data: invites, error: invitesErr } = await supabase
      .from('business_user_invites')
      .select('id, email, client_role, created_at, expires_at, invited_by_user_id')
      .eq('business_id', businessId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (invitesErr) return NextResponse.json({ error: invitesErr.message }, { status: 500 })

    // Filter out expired invites client-side (or we could filter in query with .gt)
    const now = new Date()
    const openInvites = (invites ?? []).filter((i) => new Date(i.expires_at) > now)

    return NextResponse.json({
      members: members ?? [],
      invites: openInvites,
    })
  } catch (e) {
    return authErrorResponse(e, 'GET /api/team')
  }
}
