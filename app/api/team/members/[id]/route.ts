import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'

/**
 * PATCH /api/team/members/[id]
 * Changes a member's client_role. Admin/owner only. Cannot demote the owner.
 * Body: { client_role: 'admin' | 'manager' | 'employee' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { id } = await params
    const { businessId } = ctx
    const { client_role } = await req.json()

    const validRoles = ['admin', 'manager', 'employee']
    if (!validRoles.includes(client_role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify the membership belongs to this business and is not an owner
    const { data: member } = await adminSupabase
      .from('user_businesses')
      .select('id, business_id, role, membership_status')
      .eq('id', id)
      .single()

    if (!member || member.business_id !== businessId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (member.role === 'owner') {
      return NextResponse.json({ error: 'The owner role cannot be changed.' }, { status: 403 })
    }
    if (member.membership_status !== 'active') {
      return NextResponse.json({ error: 'Member is not active.' }, { status: 409 })
    }

    await adminSupabase
      .from('user_businesses')
      .update({ client_role })
      .eq('id', id)

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
    const { businessId } = ctx

    const { data: member } = await adminSupabase
      .from('user_businesses')
      .select('id, business_id, role, membership_status')
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

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e, 'DELETE /api/team/members/[id]')
  }
}
