/**
 * POST /api/email-imports/[id]/confirm
 * Confirm a pending sales import draft.
 * Runs the shared sales-write service with the staged rows.
 * Tenant-safe: validates draft belongs to the requesting business before writing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { adminSupabase } from '@/lib/supabase/admin'
import { runSalesImport } from '@/lib/sales-import/service'
import type { ValidatedSalesRow } from '@/lib/sales-import/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await getAuthContext()
    const { id } = await params

    // Load draft — explicit businessId check before any write
    const { data: draft, error: draftErr } = await adminSupabase
      .from('sales_import_drafts')
      .select('id, business_id, status, filename, valid_row_count')
      .eq('id', id)
      .eq('business_id', businessId)  // cross-business rejection
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'pending_review') {
      return NextResponse.json(
        { error: `Draft cannot be confirmed — current status: ${draft.status}` },
        { status: 409 }
      )
    }

    if (draft.valid_row_count === 0) {
      return NextResponse.json({ error: 'Draft has no valid rows to import' }, { status: 422 })
    }

    // Load staged rows
    const { data: stagedRows, error: rowsErr } = await adminSupabase
      .from('sales_import_draft_rows')
      .select('sale_date, raw_item_name, quantity_sold, gross_sales, sale_timestamp, guest_count, check_id, station')
      .eq('draft_id', id)
      .is('validation_error', null)  // only valid rows
      .order('sort_order', { ascending: true })

    if (rowsErr) return NextResponse.json({ error: rowsErr.message }, { status: 500 })
    if (!stagedRows || stagedRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in draft' }, { status: 422 })
    }

    // Convert staged rows to ValidatedSalesRow[]
    // Re-resolution of menu_item_id happens inside runSalesImport (fresh, not from staging)
    const validRows: ValidatedSalesRow[] = stagedRows.map((r) => ({
      date:           r.sale_date,
      item_name:      r.raw_item_name,
      quantity:       Number(r.quantity_sold),
      gross_sales:    r.gross_sales !== null ? Number(r.gross_sales) : null,
      sale_timestamp: r.sale_timestamp,
      guest_count:    r.guest_count !== null ? Number(r.guest_count) : null,
      check_id:       r.check_id,
      station:        r.station,
    }))

    // Run the shared sales-write service using service-role client with explicit businessId
    // Draft id passed for traceability column on sales_uploads
    const result = await runSalesImport(
      adminSupabase,
      businessId,          // explicitly passed — never inferred from data
      draft.filename,
      validRows,
      id,                  // draftId for email_import_draft_id traceability
    )

    // Mark draft as imported and link to the new sales_upload
    await adminSupabase
      .from('sales_import_drafts')
      .update({
        status:          'imported',
        sales_upload_id: result.upload_id,
        confirmed_at:    new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ ...result, draft_id: id })
  } catch (e) {
    return authErrorResponse(e)
  }
}
