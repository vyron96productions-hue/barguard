import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { AuthError } from '@/lib/auth'

export async function getAdminContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new AuthError('Unauthorized', 401)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ub } = await (supabase as any)
    .from('user_businesses')
    .select('business_id, is_admin')
    .eq('user_id', user.id)
    .single()

  if (!(ub as { is_admin?: boolean } | null)?.is_admin) throw new AuthError('Forbidden', 403)

  return { user, adminSupabase }
}
