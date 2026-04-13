import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'
import { logTeamActivity } from '@/lib/team-activity'

/**
 * PATCH /api/team/members/[id]
 * Updates a member's client_role and/or display_name. Admin/owner only.
 * Body: { client_role?: string, display_name?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { id } = await params
    const { businessId, user } = ctx
    const body = await req.json()
    const { client_role, display_name } = body as { client_role?: string; display_name?: string }

    const validRoles = ['admin', 'manager', 'employee']
    if (client_role !== undefined && !validRoles.includes(client_role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify the membership belongs to this business and is not an owner
    const { data: member } = await adminSupabase
      .from('user_businesses')
      .select('id, business_id, role, client_role, membership_status, display_name')
      .eq('id', id)
      .single()

    if (!member || member.business_id !== businessId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (member.role === 'owner' && client_role !== undefined) {
      return NextResponse.json({ error: 'The owner role cannot be changed.' }, { status: 403 })
    }
    if (member.membership_status !== 'active') {
      return NextResponse.json({ error: 'Member is not active.' }, { status: 409 })
    }

    const updates: Record<string, unknown> = {}
    if (client_role !== undefined) updates.client_role = client_role
    if (display_name !== undefined) updates.display_name = display_name.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    await adminSupabase.from('user_businesses').update(updates).eq('id', id)

    // Log role changes
    if (client_role !== undefined && client_role !== member.client_role) {
      const { data: actorUb } = await adminSupabase
        .from('user_businesses')
        .select('display_name')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .single()
      logTeamActivity(businessId, user.id, actorUb?.display_name ?? null, 'role_changed', {
        member_name: member.display_name,
        old_role:    member.client_role,
        new_role:    client_role,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e, 'PATCH /api/team/members/[id]')
  }
}

/**
 * DELETE /api/team/members/[id]
 * Soft-deletes a member (sets membership_status = 'removed'). Admin/owner only.
 * Cannot remove the owner.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { id } = await params
    const { businessId, user } = ctx

    const { data: member } = await adminSupabase
      .from('user_businesses')
      .select('id, business_id, role, membership_status, display_name, email')
      .eq('id', id)
      .single()

    if (!member || member.business_id !== businessId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'The owner cannot be removed.' }, { status: 403 })
    }
    if (member.membership_status === 'removed') {
      return NextResponse.json({ error: 'Member is already removed.' }, { status: 409 })
    }

    // Soft delete — preserves audit history, getAuthContext() will reject them on next request
    await adminSupabase
      .from('user_businesses')
      .update({ membership_status: 'removed' })
      .eq('id', id)

    // Log removal
    const { data: actorUb } = await adminSupabase
      .from('user_businesses')
      .select('display_name')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()
    logTeamActivity(businessId, user.id, actorUb?.display_name ?? null, 'member_removed', {
      removed_name:  member.display_name,
      removed_email: member.email,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e, 'DELETE /api/team/members/[id]')
  }
}
