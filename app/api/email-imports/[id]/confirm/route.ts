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
import { logger, logError } from '@/lib/logger'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await getAuthContext()
    const { id } = await params

    // ── Atomic CAS: transition status pending_review → processing ──────────────
    // Using a single UPDATE with a WHERE status='pending_review' clause instead
    // of read-then-write. Only ONE concurrent request can win this transition;
    // any simultaneous confirm request will get 0 rows back and return 409.
    const { data: claimed, error: claimErr } = await adminSupabase
      .from('sales_import_drafts')
      .update({ status: 'processing' })
      .eq('id', id)
      .eq('business_id', businessId)    // cross-business rejection
      .eq('status', 'pending_review')   // CAS guard — only wins if still pending
      .select('id, filename, valid_row_count')
      .single()

    if (claimErr || !claimed) {
      // Could be: not found, wrong business, already processing/imported, or DB error.
      // Do a read to give the caller a meaningful error message.
      const { data: existing } = await adminSupabase
        .from('sales_import_drafts')
        .select('status')
        .eq('id', id)
        .eq('business_id', businessId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      logger.warn('email-imports/confirm', 'Concurrent confirm blocked by CAS guard', {
        draftId: id, currentStatus: existing.status,
      })
      return NextResponse.json(
        { error: `Draft cannot be confirmed — current status: ${existing.status}` },
        { status: 409 }
      )
    }

    const draft = claimed

    if (draft.valid_row_count === 0) {
      // Roll back the status claim so the draft doesn't get stuck in 'processing'
      await adminSupabase
        .from('sales_import_drafts')
        .update({ status: 'pending_review' })
        .eq('id', id)
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
    const { error: finalErr } = await adminSupabase
      .from('sales_import_drafts')
      .update({
        status:          'imported',
        sales_upload_id: result.upload_id,
        confirmed_at:    new Date().toISOString(),
      })
      .eq('id', id)

    if (finalErr) {
      // Import succeeded but the status update failed — log loudly so we can fix manually
      logError('email-imports/confirm', finalErr, {
        draftId: id, uploadId: result.upload_id,
        note: 'Import written but draft status not updated to imported',
      })
    }

    logger.info('email-imports/confirm', 'Import confirmed', {
      draftId: id, uploadId: result.upload_id,
      rowsImported: result.rows_imported ?? null,
    })

    return NextResponse.json({ ...result, draft_id: id })
  } catch (e) {
    // If an exception fires after we claimed the draft (status='processing'),
    // the draft will be stuck. Log with enough context to fix manually.
    logError('email-imports/confirm', e, { draftId: 'unknown — check processing drafts' })
    return authErrorResponse(e)
  }
}
