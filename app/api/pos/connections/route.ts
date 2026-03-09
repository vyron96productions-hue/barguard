import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { data: connections, error } = await supabase
      .from('pos_connections')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(connections ?? [])
  } catch (e) { return authErrorResponse(e) }
}

export async function DELETE(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { provider } = await req.json()
    const { error } = await supabase
      .from('pos_connections')
      .update({ is_active: false })
      .eq('business_id', businessId)
      .eq('pos_type', provider)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) { return authErrorResponse(e) }
}
