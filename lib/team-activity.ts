import { adminSupabase } from '@/lib/supabase/admin'

/**
 * Log an action to team_activity_log.
 * Always uses the service-role client so it works from any API route regardless of the
 * caller's RLS context. Failures are swallowed — logging must never break the primary action.
 */
export async function logTeamActivity(
  businessId: string,
  userId: string | null,
  displayName: string | null,
  action: string,
  details?: Record<string, unknown>,
) {
  try {
    await adminSupabase.from('team_activity_log').insert({
      business_id:  businessId,
      user_id:      userId ?? null,
      display_name: displayName ?? null,
      action,
      details:      details ?? null,
    })
  } catch {
    // Logging failures must never break the primary operation
  }
}
