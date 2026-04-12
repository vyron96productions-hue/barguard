import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'

/**
 * DELETE /api/team/invites/[id]
 * Revokes a pending invite. Admin/owner only.
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

    // Verify the invite belongs to this business before revoking
    const { data: invite } = await adminSupabase
      .from('business_user_invites')
      .select('id, business_id, accepted_at, revoked_at')
      .eq('id', id)
      .single()

    if (!invite || invite.business_id !== businessId) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'This invite has already been accepted and cannot be revoked.' }, { status: 409 })
    }
    if (invite.revoked_at) {
      return NextResponse.json({ error: 'This invite is already revoked.' }, { status: 409 })
    }

    await adminSupabase
      .from('business_user_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e, 'DELETE /api/team/invites/[id]')
  }
}
