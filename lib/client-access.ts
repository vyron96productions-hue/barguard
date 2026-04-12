/**
 * lib/client-access.ts
 * Central role types and access-enforcement helpers for the multi-user
 * team-access feature. Import from here instead of duplicating role logic.
 */

import { AuthError } from '@/lib/auth'

export type ClientRole     = 'employee' | 'manager' | 'admin'
export type MembershipRole = 'owner' | 'member'

/** Numeric rank so we can do ">= required" comparisons. */
const ROLE_RANK: Record<ClientRole, number> = {
  employee: 1,
  manager:  2,
  admin:    3,
}

/**
 * Returns the effective ClientRole for this user.
 * Owners always get 'admin' regardless of stored client_role.
 */
export function effectiveClientRole(
  membershipRole: MembershipRole,
  clientRole: ClientRole,
): ClientRole {
  return membershipRole === 'owner' ? 'admin' : clientRole
}

/** True if `actual` role meets or exceeds `required`. */
export function meetsMinimumRole(actual: ClientRole, required: ClientRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required]
}

/**
 * Throws AuthError(403) if the caller's effective role is below `required`.
 * Pass the result of getAuthContext() directly:
 *
 *   const ctx = await getAuthContext()
 *   requireMinimumClientRole(ctx, 'manager')
 */
export function requireMinimumClientRole(
  ctx: { membershipRole: MembershipRole; clientRole: ClientRole },
  required: ClientRole,
): void {
  const effective = effectiveClientRole(ctx.membershipRole, ctx.clientRole)
  if (!meetsMinimumRole(effective, required)) {
    throw new AuthError('Insufficient permissions', 403)
  }
}

/** Human-readable label for display in the team management UI. */
export const CLIENT_ROLE_LABELS: Record<ClientRole, string> = {
  employee: 'Employee',
  manager:  'Manager',
  admin:    'Admin',
}
