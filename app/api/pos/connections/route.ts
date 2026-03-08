import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const { data: connections, error } = await supabase
    .from('pos_connections')
    .select('*')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('is_active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(connections ?? [])
}

export async function DELETE(req: Request) {
  const { provider } = await req.json()
  const { error } = await supabase
    .from('pos_connections')
    .update({ is_active: false })
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('pos_type', provider)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
