/**
 * Main email poll orchestrator.
 * Fetches unread messages from Gmail, routes them to businesses,
 * validates attachments, and stages drafts for merchant review.
 *
 * Called by the /api/email-imports/poll cron route.
 */

import { adminSupabase } from '@/lib/supabase/admin'
import {
  getAccessToken,
  listUnreadMessages,
  getMessage,
  extractCsvAttachments,
  archiveMessage,
  base64urlToText,
  sha256Hex,
  getHeader,
} from './gmail'
import { lookupSenderRule } from './routing'
import { detectTemplate } from './templates'
import { normalizeRows } from './normalize'
import { isMessageAlreadySeen, isAttachmentDuplicate } from './dedupe'
import {
  insertIngestMessage,
  insertUnroutableMessage,
  updateMessageStatus,
  stageAttachment,
} from './staging'
import { parseCsvText } from '@/lib/csv'
import type { MessageProcessResult } from './types'

const POLL_BATCH_SIZE = 25

export async function runPoll(): Promise<{
  messagesFound:  number
  draftsCreated:  number
  results:        MessageProcessResult[]
  errors:         string[]
}> {
  const results:  MessageProcessResult[] = []
  const errors:   string[]               = []
  let draftsCreated = 0

  const token    = await getAccessToken()
  const messages = await listUnreadMessages(token, POLL_BATCH_SIZE)

  for (const ref of messages) {
    try {
      const result = await processMessage(token, ref.id)
      results.push(result)
      if (result.draftsCreated > 0) draftsCreated += result.draftsCreated
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`[${ref.id}] ${msg}`)
      results.push({ gmailMessageId: ref.id, status: 'failed', draftsCreated: 0, error: msg })
    }
  }

  return { messagesFound: messages.length, draftsCreated, results, errors }
}

async function processMessage(token: string, gmailMessageId: string): Promise<MessageProcessResult> {
  // Step 1: skip if already seen
  const alreadySeen = await isMessageAlreadySeen(adminSupabase, gmailMessageId)
  if (alreadySeen) {
    return { gmailMessageId, status: 'duplicate', draftsCreated: 0 }
  }

  // Step 2: fetch full message
  const message = await getMessage(token, gmailMessageId)

  const senderEmail    = parseEmailAddress(getHeader(message, 'from'))
  const recipientEmail = parseEmailAddress(getHeader(message, 'to'))
  const subject        = getHeader(message, 'subject')
  const receivedAt     = message.internalDate
    ? new Date(parseInt(message.internalDate))
    : null

  // Step 3: routing
  const routing = await lookupSenderRule(adminSupabase, senderEmail, recipientEmail)

  if (!routing.ok) {
    // Record the unroutable/conflict message and archive it so it doesn't re-appear
    await insertUnroutableMessage(adminSupabase, gmailMessageId, senderEmail, routing.reason)
    await archiveMessage(token, gmailMessageId)
    return { gmailMessageId, status: routing.reason, draftsCreated: 0 }
  }

  // Step 4: insert message record with 'received' status
  let messageDbId: string
  try {
    messageDbId = await insertIngestMessage(adminSupabase, {
      businessId:    routing.businessId,
      ruleId:        routing.ruleId,
      gmailMessageId,
      senderEmail,
      recipientEmail,
      subject,
      receivedAt,
    })
  } catch (err) {
    // Can't even record the message — skip and leave Gmail unread for retry
    throw err
  }

  // Step 5: extract CSV attachments
  const candidates = await extractCsvAttachments(token, message)
  let draftCount = 0

  if (candidates.length === 0) {
    await updateMessageStatus(adminSupabase, messageDbId, 'failed', 'No valid CSV attachments found')
    await archiveMessage(token, gmailMessageId)
    return { gmailMessageId, status: 'failed', draftsCreated: 0, error: 'No CSV attachments' }
  }

  // Step 6: process each attachment (up to 3)
  for (const candidate of candidates) {
    const csvText  = base64urlToText(candidate.data)
    const sha256   = sha256Hex(csvText)
    const isDuplicate = await isAttachmentDuplicate(adminSupabase, routing.businessId, sha256)

    // Parse headers for template detection
    const { headers, rows, errors: parseErrors } = parseCsvText(csvText)

    if (parseErrors.length > 0 && rows.length === 0) {
      await stageAttachment(adminSupabase, {
        messageId:         messageDbId,
        businessId:        routing.businessId,
        gmailAttachmentId: candidate.gmailAttachmentId,
        filename:          candidate.filename,
        mimeType:          candidate.mimeType,
        sizeBytes:         candidate.sizeBytes,
        sha256,
        rawContent:        candidate.data,
        isDuplicate,
        rejection:         { reason: 'parse_error', detail: parseErrors.slice(0, 3).join('; ') },
      })
      continue
    }

    const fieldMapping = detectTemplate(headers)
    if (!fieldMapping) {
      await stageAttachment(adminSupabase, {
        messageId:         messageDbId,
        businessId:        routing.businessId,
        gmailAttachmentId: candidate.gmailAttachmentId,
        filename:          candidate.filename,
        mimeType:          candidate.mimeType,
        sizeBytes:         candidate.sizeBytes,
        sha256,
        rawContent:        candidate.data,
        isDuplicate,
        rejection:         { reason: 'invalid_template', detail: `Unrecognized headers: ${headers.slice(0, 5).join(', ')}` },
      })
      continue
    }

    // Normalize rows
    const normalizeResult = normalizeRows(rows, fieldMapping)

    await stageAttachment(adminSupabase, {
      messageId:         messageDbId,
      businessId:        routing.businessId,
      gmailAttachmentId: candidate.gmailAttachmentId,
      filename:          candidate.filename,
      mimeType:          candidate.mimeType,
      sizeBytes:         candidate.sizeBytes,
      sha256,
      rawContent:        candidate.data,
      isDuplicate,
      normalizeResult,
    })

    if (normalizeResult.validRows.length > 0) draftCount++
  }

  // Step 7: mark message staged + archive Gmail message
  await updateMessageStatus(adminSupabase, messageDbId, 'staged')
  await archiveMessage(token, gmailMessageId)

  // Step 8: send Resend notification if at least one draft was created
  if (draftCount > 0) {
    await sendDraftNotification(routing.businessId).catch(() => {
      // Notification failure must never fail the overall poll
    })
  }

  return {
    gmailMessageId,
    status:        'staged',
    draftsCreated: draftCount,
  }
}

// ── Notification ─────────────────────────────────────────────────────────────

async function sendDraftNotification(businessId: string): Promise<void> {
  const { data: biz } = await adminSupabase
    .from('businesses')
    .select('name, contact_email')
    .eq('id', businessId)
    .single()

  if (!biz?.contact_email) return  // no email on file — skip silently

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from:    'BarGuard <support@barguard.app>',
    to:      biz.contact_email,
    subject: `Sales import ready for review — ${biz.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <p>Hi,</p>
        <p>A sales CSV was received via email and is ready for your review in BarGuard.</p>
        <p>
          <a href="https://barguard.app/email-imports"
             style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#0f172a;font-weight:bold;border-radius:6px;text-decoration:none">
            Review Import
          </a>
        </p>
        <p style="color:#64748b;font-size:13px">
          No data has been imported yet — you'll need to review and confirm before anything is saved.
        </p>
      </div>
    `,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract plain email address from a From/To header value. */
function parseEmailAddress(header: string): string {
  // "Display Name <email@example.com>" → "email@example.com"
  const match = header.match(/<([^>]+)>/)
  return (match ? match[1] : header).toLowerCase().trim()
}
