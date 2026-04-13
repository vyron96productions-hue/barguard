import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'

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
      .select('id, user_id, role, client_role, joined_at, membership_status, display_name, email')
      .eq('business_id', businessId)
      .eq('membership_status', 'active')
      .order('joined_at')

    if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

    // For any member without a stored email, look it up from auth.users (owner rows
    // never go through the invite flow so they won't have email set yet).
    const enriched = await Promise.all(
      (members ?? []).map(async (m) => {
        if (m.email) return m
        try {
          const { data } = await adminSupabase.auth.admin.getUserById(m.user_id)
          return { ...m, email: data.user?.email ?? null }
        } catch {
          return m
        }
      })
    )

    // Pending invites (open, not expired)
    const { data: invites, error: invitesErr } = await supabase
      .from('business_user_invites')
      .select('id, email, display_name, client_role, created_at, expires_at, invited_by_user_id')
      .eq('business_id', businessId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (invitesErr) return NextResponse.json({ error: invitesErr.message }, { status: 500 })

    const now = new Date()
    const openInvites = (invites ?? []).filter((i) => new Date(i.expires_at) > now)

    return NextResponse.json({
      members: enriched,
      invites: openInvites,
    })
  } catch (e) {
    return authErrorResponse(e, 'GET /api/team')
  }
}
