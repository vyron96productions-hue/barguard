/**
 * GET /api/email-imports
 * List sales import drafts for the current business, newest first.
 * Only returns pending_review and recently completed drafts.
 */

import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data, error } = await supabase
      .from('sales_import_drafts')
      .select(`
        id,
        filename,
        status,
        row_count,
        valid_row_count,
        invalid_row_count,
        has_duplicate_warning,
        expires_at,
        created_at,
        confirmed_at,
        cancelled_at,
        sales_upload_id,
        email_ingest_messages (
          sender_email,
          subject,
          received_at
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (e) {
    return authErrorResponse(e)
  }
}
