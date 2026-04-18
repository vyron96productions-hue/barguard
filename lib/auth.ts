import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logError } from '@/lib/logger'
import type { ClientRole, MembershipRole } from '@/lib/client-access'
import { effectiveClientRole } from '@/lib/client-access'
import { AuthError } from '@/lib/errors'

export { AuthError }

/**
 * Call from any API route handler to get the authenticated user's context.
 * Throws AuthError (401/403) if unauthenticated or has no *active* business membership.
 *
 * Removed members (membership_status = 'removed') are rejected here —
 * they will receive a 403 from every protected API route.
 */
export async function getAuthContext() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new AuthError('Unauthorized', 401)

  const { data: ubRaw, error: ubErr } = await supabase
    .from('user_businesses')
    .select('business_id, role, client_role, membership_status')
    .eq('user_id', user.id)
    .eq('membership_status', 'active')  // removed members are rejected here
    .maybeSingle()

  if (ubErr || !ubRaw) throw new AuthError('No business found for this account', 403)

  // New columns (client_role, membership_status) may not be present in generated
  // Supabase TS types yet — cast explicitly.
  const ub = ubRaw as unknown as {
    business_id:       string
    role:              string          // 'owner' | 'member'
    client_role:       string          // 'employee' | 'manager' | 'admin'
    membership_status: string          // 'active' | 'removed'
  }

  const membershipRole = ub.role as MembershipRole
  // client_role may be missing pre-migration — fall back to 'admin' so existing
  // owners are never accidentally downgraded. Once the migration runs this is always set.
  const rawClientRole  = (ub.client_role ?? 'admin') as ClientRole
  const clientRole     = effectiveClientRole(membershipRole, rawClientRole)

  return {
    supabase,
    user,
    businessId:    ub.business_id,
    membershipRole,
    clientRole,
    isOwner:       membershipRole === 'owner',
  }
}

/**
 * Converts an error thrown by getAuthContext (or any handler) into a NextResponse.
 */
export function authErrorResponse(e: unknown, route?: string): NextResponse {
  if (e instanceof AuthError) {
    logError(route ?? 'unknown', e, { status: e.status })
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  logError(route ?? 'unknown', e)
  const msg = e instanceof Error ? e.message : 'Internal server error'
  return NextResponse.json({ error: msg }, { status: 500 })
}
