import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { data, error } = await supabase
      .from('pos_sync_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('synced_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data ?? [])
  } catch (e) { return authErrorResponse(e) }
}
