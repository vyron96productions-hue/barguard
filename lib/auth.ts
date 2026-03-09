import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export class AuthError extends Error {
  constructor(message: string, public status = 401) { super(message) }
}

/**
 * Call from any API route handler to get the authenticated user's context.
 * Throws AuthError (401/403) if unauthenticated or has no associated business.
 */
export async function getAuthContext() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new AuthError('Unauthorized', 401)

  const { data: ub, error: ubErr } = await supabase
    .from('user_businesses')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (ubErr || !ub) throw new AuthError('No business found for this account', 403)

  return {
    supabase,
    user,
    businessId: ub.business_id as string,
  }
}

/**
 * Converts an error thrown by getAuthContext (or any handler) into a NextResponse.
 */
export function authErrorResponse(e: unknown): NextResponse {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  const msg = e instanceof Error ? e.message : 'Internal server error'
  return NextResponse.json({ error: msg }, { status: 500 })
}
