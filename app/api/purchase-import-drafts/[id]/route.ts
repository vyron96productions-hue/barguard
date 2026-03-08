import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: draft, error: draftError } = await supabase
    .from('purchase_import_drafts')
    .select('*, document_upload:document_uploads(id, filename, file_type, file_data, raw_extracted_text)')
    .eq('id', id)
    .eq('business_id', DEMO_BUSINESS_ID)
    .single()

  if (draftError) return NextResponse.json({ error: draftError.message }, { status: 404 })

  const { data: lines, error: linesError } = await supabase
    .from('purchase_import_draft_lines')
    .select('*, inventory_item:inventory_items(id, name, unit, category)')
    .eq('draft_id', id)
    .order('sort_order')

  if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 })

  return NextResponse.json({ ...draft, lines: lines ?? [] })
}
