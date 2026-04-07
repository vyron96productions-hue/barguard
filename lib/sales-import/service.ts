/**
 * Shared sales import service.
 *
 * Extracted from /api/uploads/sales/route.ts.
 * Handles: sales_uploads insert, menu item resolution (alias → exact → fuzzy),
 * sales_transactions insert, new alias upsert.
 *
 * Called by:
 *   - /api/uploads/sales   (manual CSV upload, user-scoped Supabase client)
 *   - /api/email-imports/[id]/confirm  (email draft confirm, service-role client with explicit businessId)
 *
 * The caller is responsible for CSV parsing and row validation.
 * This function receives already-validated rows and writes final production data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ValidatedSalesRow, SalesImportResult } from './types'

// ── Fuzzy matching helpers (lifted verbatim from the original route) ──────────

const STRIP = new Set([
  'shot', 'shots', 'neat', 'rocks', 'on', 'the', 'up', 'straight', 'chilled',
  'frozen', 'blended', 'and', 'with', 'service', 'glass', 'pint', 'draft',
  'can', 'bottle', 'double', 'dbl', 'single', 'triple', 'a', 'of', 'cold',
  'premium', 'top', 'shelf', 'house', 'well', 'order', 'special',
])

function nameWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP.has(w))
}

function fuzzyScore(rawName: string, menuName: string): number {
  const rawWords  = nameWords(rawName)
  const menuWords = nameWords(menuName)
  if (menuWords.length === 0 || rawWords.length === 0) return 0
  const matched = menuWords.filter((w) => rawWords.includes(w)).length
  return matched / menuWords.length
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Write validated sales rows to production tables.
 *
 * @param supabase    Supabase client (user-scoped or service-role).
 * @param businessId  The business to write data for. Always pass explicitly — never infer.
 * @param filename    Original filename (manual: file.name, email: synthesized from draft id).
 * @param validRows   Already-validated rows from CSV parsing or staging tables.
 * @param draftId     Optional: email import draft id for traceability column on sales_uploads.
 */
export async function runSalesImport(
  supabase: SupabaseClient,
  businessId: string,
  filename: string,
  validRows: ValidatedSalesRow[],
  draftId?: string,
): Promise<SalesImportResult> {
  const allDates    = validRows.map((r) => r.date).sort()
  const periodStart = allDates[0]
  const periodEnd   = allDates[allDates.length - 1]

  // Build the insert payload; include traceability column when called from email confirm
  const uploadPayload: Record<string, unknown> = {
    business_id:  businessId,
    filename,
    period_start: periodStart,
    period_end:   periodEnd,
    row_count:    validRows.length,
  }
  if (draftId) uploadPayload.email_import_draft_id = draftId

  const { data: upload, error: uploadError } = await supabase
    .from('sales_uploads')
    .insert(uploadPayload)
    .select()
    .single()

  if (uploadError || !upload) {
    throw new Error(uploadError?.message ?? 'Failed to create sales upload record')
  }

  // Bulk-load resolution tables (2 queries instead of N)
  const [{ data: menuItems }, { data: menuAliases }] = await Promise.all([
    supabase.from('menu_items').select('id, name').eq('business_id', businessId),
    supabase.from('menu_item_aliases').select('raw_name, menu_item_id').eq('business_id', businessId),
  ])

  const exactByName = new Map((menuItems  ?? []).map((m) => [m.name.toLowerCase(), m.id]))
  const aliasByName = new Map((menuAliases ?? []).map((a) => [a.raw_name.toLowerCase(), a.menu_item_id]))

  // Track new fuzzy-matched aliases to save (prevents duplicate alias creation within batch)
  const newAliases = new Map<string, string>() // raw_name → menu_item_id

  function resolveId(rawName: string): string | null {
    const lower = rawName.toLowerCase()

    // 1. Saved alias (exact)
    const fromAlias = aliasByName.get(lower)
    if (fromAlias) return fromAlias

    // 2. Exact menu item name match
    const fromExact = exactByName.get(lower)
    if (fromExact) return fromExact

    // 3. Fuzzy match — find best-scoring menu item
    let bestScore = 0
    let bestId: string | null = null
    for (const mi of menuItems ?? []) {
      const score = fuzzyScore(rawName, mi.name)
      if (score > bestScore) { bestScore = score; bestId = mi.id }
    }

    if (bestScore >= 0.65 && bestId) {
      newAliases.set(rawName, bestId)
      aliasByName.set(lower, bestId) // prevent duplicate alias within batch
      return bestId
    }

    return null
  }

  const transactions = validRows.map((r) => ({
    upload_id:      upload.id,
    business_id:    businessId,
    sale_date:      r.date,
    raw_item_name:  r.item_name,
    menu_item_id:   resolveId(r.item_name),
    quantity_sold:  r.quantity,
    gross_sales:    r.gross_sales,
    sale_timestamp: r.sale_timestamp,
    guest_count:    r.guest_count,
    check_id:       r.check_id,
    station:        r.station,
  }))

  const { error: txError } = await supabase.from('sales_transactions').insert(transactions)
  if (txError) throw new Error(txError.message)

  if (newAliases.size > 0) {
    await supabase.from('menu_item_aliases').upsert(
      Array.from(newAliases.entries()).map(([raw_name, menu_item_id]) => ({
        business_id: businessId,
        raw_name,
        menu_item_id,
      })),
      { onConflict: 'business_id,raw_name' }
    )
  }

  const unresolved       = transactions.filter((t) => !t.menu_item_id).map((t) => t.raw_item_name)
  const uniqueUnresolved = [...new Set(unresolved)]

  return {
    upload_id:          upload.id,
    rows_imported:      validRows.length,
    matched:            transactions.filter((t) => !!t.menu_item_id).length,
    auto_linked:        newAliases.size,
    unresolved_aliases: uniqueUnresolved,
  }
}
