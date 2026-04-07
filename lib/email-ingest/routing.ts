/**
 * Sender rule lookup.
 * Queries email_import_rules for a matching active rule.
 * Returns ok+businessId, or a typed failure reason.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RoutingResult } from './types'

export async function lookupSenderRule(
  adminSupabase: SupabaseClient,
  senderEmail: string,
  recipientEmail?: string,
): Promise<RoutingResult> {
  const normalizedSender = senderEmail.toLowerCase().trim()
  const normalizedRecipient = recipientEmail?.toLowerCase().trim() ?? null

  // Fetch all active rules matching this sender (may be multiple if aliases differ)
  const { data: rules, error } = await adminSupabase
    .from('email_import_rules')
    .select('id, business_id, recipient_alias')
    .eq('is_active', true)
    // Use ilike for case-insensitive match on the sender_email column
    .ilike('sender_email', normalizedSender)

  if (error) throw new Error(`Routing lookup failed: ${error.message}`)
  if (!rules || rules.length === 0) return { ok: false, reason: 'unroutable' }

  // Filter by recipient alias if one is present in the rules
  const aliasRules = rules.filter((r) => r.recipient_alias !== null)
  const openRules  = rules.filter((r) => r.recipient_alias === null)

  let matchingRules = rules

  if (aliasRules.length > 0 && normalizedRecipient) {
    // Prefer alias-specific rules when we have a recipient to match against
    const aliasMatches = aliasRules.filter(
      (r) => r.recipient_alias!.toLowerCase() === normalizedRecipient
    )
    if (aliasMatches.length > 0) {
      matchingRules = aliasMatches
    } else {
      // Fall back to open (no-alias) rules
      matchingRules = openRules
    }
  } else if (aliasRules.length > 0 && !normalizedRecipient) {
    // Alias rules exist but no recipient in the message — use open rules only
    matchingRules = openRules
  }

  if (matchingRules.length === 0) return { ok: false, reason: 'unroutable' }

  // More than one rule matches → conflict
  const uniqueBusinesses = new Set(matchingRules.map((r) => r.business_id))
  if (uniqueBusinesses.size > 1 || matchingRules.length > 1) {
    return { ok: false, reason: 'routing_conflict' }
  }

  return {
    ok:         true,
    businessId: matchingRules[0].business_id,
    ruleId:     matchingRules[0].id,
  }
}
