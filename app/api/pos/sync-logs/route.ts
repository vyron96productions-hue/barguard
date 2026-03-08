import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const { data, error } = await supabase
    .from('pos_sync_logs')
    .select('*')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('synced_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}
