import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function POST() {
  const { error } = await supabase
    .from('inventory_usage_summaries')
    .delete()
    .eq('business_id', DEMO_BUSINESS_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
