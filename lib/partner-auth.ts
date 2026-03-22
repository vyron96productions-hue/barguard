import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { AuthError } from '@/lib/auth'

export interface Partner {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string | null
  partner_code: string
  status: 'pending' | 'active' | 'suspended'
  pricing_type: 'rev_share' | 'wholesale' | 'custom'
  revenue_share_pct: number | null
  wholesale_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getPartnerContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new AuthError('Unauthorized', 401)

  const partnerId = user.user_metadata?.partner_id as string | undefined
  if (!partnerId) throw new AuthError('Not a partner account', 403)

  // Use adminSupabase to bypass RLS — partners table has no user-level RLS policies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partner, error: partnerErr } = await (adminSupabase as any)
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  if (partnerErr || !partner) throw new AuthError('Partner not found', 403)
  if ((partner as Partner).status === 'suspended') throw new AuthError('Partner account suspended', 403)

  return { user, supabase, adminSupabase, partner: partner as Partner, partnerId }
}
