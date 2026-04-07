/** Raw Gmail message list entry from messages.list API */
export interface GmailMessageRef {
  id: string
  threadId: string
}

/** Gmail message header (name/value pair) */
export interface GmailHeader {
  name: string
  value: string
}

/** A single part of a multipart Gmail message */
export interface GmailPart {
  partId: string
  mimeType: string
  filename: string
  headers: GmailHeader[]
  body: {
    attachmentId?: string
    size: number
    data?: string  // base64url encoded, present for small inline content
  }
  parts?: GmailPart[]
}

/** Full Gmail message payload (format=full) */
export interface GmailMessage {
  id: string
  threadId: string
  internalDate: string  // Unix ms as string
  payload: {
    headers: GmailHeader[]
    parts?: GmailPart[]
    body?: { size: number; data?: string }
    mimeType: string
  }
}

/** Result of looking up a sender against email_import_rules */
export type RoutingResult =
  | { ok: true; businessId: string; ruleId: string }
  | { ok: false; reason: 'unroutable' | 'routing_conflict' }

/** Maps canonical field names to the actual CSV column header found in the file */
export type FieldMapping = Record<string, string>

/** An attachment candidate extracted from a Gmail message */
export interface AttachmentCandidate {
  gmailAttachmentId: string | null  // null when data is inline
  filename: string
  mimeType: string
  sizeBytes: number
  data: string  // base64url encoded content
}

/** Result of processing a single Gmail message */
export interface MessageProcessResult {
  gmailMessageId: string
  status: 'staged' | 'failed' | 'duplicate' | 'unroutable' | 'routing_conflict'
  draftsCreated: number
  error?: string
}
