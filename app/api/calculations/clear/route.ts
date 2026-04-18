import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export async function POST() {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'manager')
    const { supabase, businessId } = ctx
    const { error } = await supabase
      .from('inventory_usage_summaries')
      .delete()
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
