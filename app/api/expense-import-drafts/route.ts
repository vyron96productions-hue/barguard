import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data, error } = await supabase
      .from('expense_import_drafts')
      .select('*, document_upload:document_uploads(id, filename, file_type)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return authErrorResponse(e)
  }
}
