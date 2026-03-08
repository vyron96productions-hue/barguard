import { NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET() {
  const { data, error } = await supabase
    .from('purchase_import_drafts')
    .select('*, document_upload:document_uploads(id, filename, file_type)')
    .eq('business_id', DEMO_BUSINESS_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
