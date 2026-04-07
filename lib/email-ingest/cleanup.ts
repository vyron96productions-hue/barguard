/**
 * Draft cleanup service.
 * - Marks pending_review drafts older than 14 days as expired.
 * - Nulls out raw_content on email_ingest_attachments for expired/cancelled
 *   drafts older than 30 days (retains row metadata for audit).
 * - Does NOT delete any production sales rows or finalized data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function runCleanup(adminSupabase: SupabaseClient): Promise<{
  expired: number
  payloadsCleared: number
}> {
  // 1. Expire stale pending_review drafts (>14 days old)
  const { data: expiredDrafts, error: expireErr } = await adminSupabase
    .from('sales_import_drafts')
    .update({ status: 'expired' })
    .eq('status', 'pending_review')
    .lt('expires_at', new Date().toISOString())
    .select('id, attachment_id')

  if (expireErr) throw new Error(`Expire step failed: ${expireErr.message}`)

  const expired = expiredDrafts?.length ?? 0

  // 2. Clear raw attachment content for expired/cancelled drafts older than 30 days
  // Find attachment ids linked to expired/cancelled drafts older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleDrafts, error: staleErr } = await adminSupabase
    .from('sales_import_drafts')
    .select('attachment_id')
    .in('status', ['expired', 'cancelled'])
    .lt('created_at', thirtyDaysAgo)

  if (staleErr) throw new Error(`Stale draft lookup failed: ${staleErr.message}`)

  const attachmentIds = (staleDrafts ?? [])
    .map((d: { attachment_id: string }) => d.attachment_id)
    .filter(Boolean)

  let payloadsCleared = 0

  if (attachmentIds.length > 0) {
    const { error: clearErr } = await adminSupabase
      .from('email_ingest_attachments')
      .update({ raw_content: null })
      .in('id', attachmentIds)
      .not('raw_content', 'is', null)  // only update rows that still have content

    if (clearErr) throw new Error(`Payload clear step failed: ${clearErr.message}`)
    payloadsCleared = attachmentIds.length
  }

  return { expired, payloadsCleared }
}
