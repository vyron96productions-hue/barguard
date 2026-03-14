import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { fetchCloverItems } from '@/lib/pos/clover'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data: conn } = await supabase
      .from('pos_connections')
      .select('access_token, location_id')
      .eq('business_id', businessId)
      .eq('pos_type', 'clover')
      .eq('is_active', true)
      .single()

    if (!conn) return NextResponse.json({ error: 'Clover not connected' }, { status: 400 })

    const items = await fetchCloverItems(conn.access_token, conn.location_id!)
    return NextResponse.json(items)
  } catch (e) {
    return authErrorResponse(e)
  }
}
