import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { AuthError } from '@/lib/auth'

export async function getAdminContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new AuthError('Unauthorized', 401)

  // is_admin is not in the generated types (added via migration) — cast the result shape explicitly.
  const { data: ubRaw } = await supabase
    .from('user_businesses')
    .select('business_id, is_admin')
    .eq('user_id', user.id)
    .eq('membership_status', 'active')
    .single()

  const ub = ubRaw as unknown as { business_id: string; is_admin: boolean } | null
  if (!ub?.is_admin) throw new AuthError('Forbidden', 403)

  return { user, adminSupabase }
}
