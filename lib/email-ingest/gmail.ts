/**
 * Gmail API client using raw fetch + OAuth 2.0 token refresh.
 * No googleapis package required.
 */

import type { GmailMessage, GmailMessageRef, AttachmentCandidate } from './types'

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const TOKEN_URL  = 'https://oauth2.googleapis.com/token'

// ── Token refresh ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) return cachedToken

  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error('Gmail OAuth credentials missing from environment variables')
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gmail token refresh failed (${res.status}): ${body}`)
  }

  const json = await res.json() as { access_token: string; expires_in: number }
  cachedToken    = json.access_token
  tokenExpiresAt = Date.now() + json.expires_in * 1000
  return cachedToken
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function gmailGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gmail API error ${res.status} at ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function gmailPost(path: string, token: string, body: unknown): Promise<void> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail API error ${res.status} at ${path}: ${text}`)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** List unread inbox messages, up to maxResults. */
export async function listUnreadMessages(token: string, maxResults = 25): Promise<GmailMessageRef[]> {
  const data = await gmailGet<{ messages?: GmailMessageRef[] }>(
    `/messages?q=is:unread+in:inbox&maxResults=${maxResults}`,
    token,
  )
  return data.messages ?? []
}

/** Fetch a full message with all parts and attachment metadata. */
export async function getMessage(token: string, messageId: string): Promise<GmailMessage> {
  return gmailGet<GmailMessage>(`/messages/${messageId}?format=full`, token)
}

/** Fetch attachment data for a large attachment not inlined in the message. */
export async function getAttachmentData(token: string, messageId: string, attachmentId: string): Promise<string> {
  const data = await gmailGet<{ data: string }>(`/messages/${messageId}/attachments/${attachmentId}`, token)
  return data.data  // base64url encoded
}

/**
 * Mark a Gmail message as read and remove it from the inbox (archive).
 * Only called after successful staging or terminal routing failure.
 */
export async function archiveMessage(token: string, messageId: string): Promise<void> {
  await gmailPost(`/messages/${messageId}/modify`, token, {
    removeLabelIds: ['UNREAD', 'INBOX'],
  })
}

// ── Attachment extraction ─────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',  // some POS exports send CSV with text/plain
])

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024  // 5 MB
const MAX_ATTACHMENTS      = 3

/**
 * Extract candidate CSV attachments from a Gmail message.
 * Fetches attachment data for large parts that are referenced by ID.
 */
export async function extractCsvAttachments(
  token: string,
  message: GmailMessage,
): Promise<AttachmentCandidate[]> {
  const candidates: AttachmentCandidate[] = []
  const parts = flattenParts(message.payload.parts ?? [])

  for (const part of parts) {
    if (candidates.length >= MAX_ATTACHMENTS) break
    if (!part.filename) continue

    const lowerName = part.filename.toLowerCase()
    const mimeOk    = ACCEPTED_MIME_TYPES.has(part.mimeType)
    const extOk     = lowerName.endsWith('.csv')

    if (!mimeOk && !extOk) continue
    if (part.body.size > MAX_ATTACHMENT_BYTES) continue

    let data: string
    if (part.body.data) {
      data = part.body.data
    } else if (part.body.attachmentId) {
      data = await getAttachmentData(token, message.id, part.body.attachmentId)
    } else {
      continue  // no data available
    }

    candidates.push({
      gmailAttachmentId: part.body.attachmentId ?? null,
      filename:          part.filename,
      mimeType:          part.mimeType,
      sizeBytes:         part.body.size,
      data,
    })
  }

  return candidates
}

/** Recursively flatten a nested parts tree into a flat list. */
function flattenParts(parts: GmailMessage['payload']['parts']): NonNullable<GmailMessage['payload']['parts']> {
  const result: NonNullable<GmailMessage['payload']['parts']> = []
  for (const part of parts ?? []) {
    result.push(part)
    if (part.parts) result.push(...flattenParts(part.parts))
  }
  return result
}

/** Decode a base64url string to a UTF-8 text string. */
export function base64urlToText(b64url: string): string {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

/** Compute SHA-256 hex digest of a string (for attachment dedup). */
export function sha256Hex(text: string): string {
  const { createHash } = require('crypto') as typeof import('crypto')
  return createHash('sha256').update(text).digest('hex')
}

/** Extract a named header value from a Gmail message. */
export function getHeader(message: GmailMessage, name: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )
  return header?.value ?? ''
}
