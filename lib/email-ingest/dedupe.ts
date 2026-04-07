/**
 * Duplicate detection for email ingest.
 * All checks are soft warnings — they surface in draft metadata but do not hard-block.
 * Only the message-level Gmail ID check is an operational skip (no re-staging).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/** Returns true if this Gmail message ID has already been processed (any status). */
export async function isMessageAlreadySeen(
  adminSupabase: SupabaseClient,
  gmailMessageId: string,
): Promise<boolean> {
  const { data, error } = await adminSupabase
    .from('email_ingest_messages')
    .select('id')
    .eq('gmail_message_id', gmailMessageId)
    .maybeSingle()

  if (error) throw new Error(`Dedupe message check failed: ${error.message}`)
  return data !== null
}

/**
 * Returns true if the same attachment hash has already been imported (status=imported)
 * or is currently pending for this business.
 * Soft duplicate — draft is still created but flagged.
 */
export async function isAttachmentDuplicate(
  adminSupabase: SupabaseClient,
  businessId: string,
  sha256: string,
): Promise<boolean> {
  const { data, error } = await adminSupabase
    .from('email_ingest_attachments')
    .select('id')
    .eq('business_id', businessId)
    .eq('sha256', sha256)
    .maybeSingle()

  if (error) throw new Error(`Dedupe attachment check failed: ${error.message}`)
  return data !== null
}
