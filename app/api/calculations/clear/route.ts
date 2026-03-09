import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function POST() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { error } = await supabase
      .from('inventory_usage_summaries')
      .delete()
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
