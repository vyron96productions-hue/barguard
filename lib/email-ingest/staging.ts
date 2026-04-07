/**
 * Staging: creates all email ingest + draft records in the database.
 *
 * Atomicity guarantee: email_ingest_messages is inserted with status='received' first.
 * If any later step fails, the message record stays as 'failed' so the next poll
 * run skips it via the Gmail message ID dedupe check (no infinite retry).
 * The Gmail message is archived only after this function returns successfully.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ValidatedSalesRow } from '@/lib/sales-import/types'
import type { NormalizeResult } from './normalize'

interface StageMessageInput {
  adminSupabase:     SupabaseClient
  businessId:        string
  ruleId:            string
  gmailMessageId:    string
  senderEmail:       string
  recipientEmail:    string
  subject:           string
  receivedAt:        Date | null
}

interface StageAttachmentInput {
  messageId:         string
  businessId:        string
  gmailAttachmentId: string | null
  filename:          string
  mimeType:          string
  sizeBytes:         number
  sha256:            string
  rawContent:        string  // base64 CSV text for audit
  isDuplicate:       boolean
  rejection?:        { reason: 'invalid_template' | 'parse_error'; detail: string }
  normalizeResult?:  NormalizeResult
}

/** Create the email_ingest_messages row. Returns the DB row id. */
export async function insertIngestMessage(
  adminSupabase: SupabaseClient,
  input: Omit<StageMessageInput, 'adminSupabase'>,
): Promise<string> {
  const { data, error } = await adminSupabase
    .from('email_ingest_messages')
    .insert({
      business_id:      input.businessId,
      rule_id:          input.ruleId,
      gmail_message_id: input.gmailMessageId,
      sender_email:     input.senderEmail,
      recipient_email:  input.recipientEmail,
      subject:          input.subject,
      received_at:      input.receivedAt?.toISOString() ?? null,
      status:           'received',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to insert ingest message: ${error?.message}`)
  return data.id
}

/** Update email_ingest_messages status after processing. */
export async function updateMessageStatus(
  adminSupabase: SupabaseClient,
  messageDbId: string,
  status: 'staged' | 'failed' | 'unroutable' | 'routing_conflict',
  errorMessage?: string,
): Promise<void> {
  await adminSupabase
    .from('email_ingest_messages')
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at:  new Date().toISOString(),
    })
    .eq('id', messageDbId)
}

/** Insert a non-routeable message record (no business_id). */
export async function insertUnroutableMessage(
  adminSupabase: SupabaseClient,
  gmailMessageId: string,
  senderEmail: string,
  reason: 'unroutable' | 'routing_conflict',
): Promise<void> {
  await adminSupabase
    .from('email_ingest_messages')
    .insert({
      gmail_message_id: gmailMessageId,
      sender_email:     senderEmail,
      status:           reason,
      processed_at:     new Date().toISOString(),
    })
}

/**
 * Stage a full accepted attachment into the draft tables.
 * Returns the sales_import_drafts row id.
 */
export async function stageAttachment(
  adminSupabase: SupabaseClient,
  input: StageAttachmentInput,
): Promise<string> {
  const { normalizeResult } = input

  const attachmentStatus = input.rejection
    ? input.rejection.reason
    : input.isDuplicate
      ? 'duplicate'
      : 'accepted'

  // Insert attachment record
  const { data: att, error: attErr } = await adminSupabase
    .from('email_ingest_attachments')
    .insert({
      message_id:          input.messageId,
      business_id:         input.businessId,
      gmail_attachment_id: input.gmailAttachmentId,
      filename:            input.filename,
      content_type:        input.mimeType,
      size_bytes:          input.sizeBytes,
      sha256:              input.sha256,
      raw_content:         input.rawContent,
      status:              attachmentStatus,
      rejection_reason:    input.rejection?.detail ?? null,
    })
    .select('id')
    .single()

  if (attErr || !att) throw new Error(`Failed to insert attachment: ${attErr?.message}`)

  if (!normalizeResult) {
    // Rejected attachment — no draft needed
    return att.id
  }

  const { validRows, rowErrors, truncated } = normalizeResult
  const totalRawRows = validRows.length + rowErrors.length + (truncated ? 1 : 0)
  const draftStatus  = 'pending_review'

  // Insert draft
  const { data: draft, error: draftErr } = await adminSupabase
    .from('sales_import_drafts')
    .insert({
      business_id:          input.businessId,
      message_id:           input.messageId,
      attachment_id:        att.id,
      filename:             input.filename,
      status:               draftStatus,
      row_count:            totalRawRows,
      valid_row_count:      validRows.length,
      invalid_row_count:    rowErrors.length,
      has_duplicate_warning: input.isDuplicate,
    })
    .select('id')
    .single()

  if (draftErr || !draft) throw new Error(`Failed to insert draft: ${draftErr?.message}`)

  // Insert valid rows
  if (validRows.length > 0) {
    const rowInserts = validRows.map((r: ValidatedSalesRow, i: number) => ({
      draft_id:       draft.id,
      business_id:    input.businessId,
      sort_order:     i,
      sale_date:      r.date,
      raw_item_name:  r.item_name,
      quantity_sold:  r.quantity,
      gross_sales:    r.gross_sales,
      sale_timestamp: r.sale_timestamp,
      guest_count:    r.guest_count,
      check_id:       r.check_id,
      station:        r.station,
    }))

    const { error: rowErr } = await adminSupabase
      .from('sales_import_draft_rows')
      .insert(rowInserts)

    if (rowErr) throw new Error(`Failed to insert draft rows: ${rowErr.message}`)
  }

  return draft.id
}
