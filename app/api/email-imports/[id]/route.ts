/**
 * GET /api/email-imports/[id]
 * Return one draft with its rows for the review UI.
 * Tenant-scoped: only returns drafts belonging to the authenticated user's business.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await params

    const { data: draft, error } = await supabase
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
        ),
        sales_import_draft_rows (
          id,
          sort_order,
          sale_date,
          raw_item_name,
          quantity_sold,
          gross_sales,
          sale_timestamp,
          guest_count,
          check_id,
          station,
          menu_item_id,
          validation_error,
          is_duplicate_warning
        )
      `)
      .eq('id', id)
      .eq('business_id', businessId)  // explicit tenant check — not relying solely on RLS
      .single()

    if (error || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Sort rows client-side to avoid complex order_by on nested select
    const rows = ((draft as unknown as Record<string, unknown>).sales_import_draft_rows as unknown[]) ?? []
    const sorted = [...rows].sort((a: unknown, b: unknown) => {
      const ra = a as Record<string, number>
      const rb = b as Record<string, number>
      return (ra.sort_order ?? 0) - (rb.sort_order ?? 0)
    })

    return NextResponse.json({ ...draft, sales_import_draft_rows: sorted })
  } catch (e) {
    return authErrorResponse(e)
  }
}
