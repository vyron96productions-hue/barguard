/**
 * Row normalization and coercion for email-ingest CSV rows.
 *
 * Accepts raw parsed CSV rows (Record<string, string>) plus a resolved FieldMapping,
 * and returns typed, coerced ValidatedSalesRow objects alongside any row-level errors.
 *
 * Uses lib/validation helpers (not re-implemented here).
 */

import { parseFloatSafe } from '@/lib/validation'
import type { FieldMapping } from './types'
import type { ValidatedSalesRow } from '@/lib/sales-import/types'

const MAX_ROWS = 10_000

// Supported date formats in order of preference
const DATE_PATTERNS: Array<(s: string) => Date | null> = [
  // ISO 8601: 2024-03-01
  (s) => { const d = new Date(s); return isNaN(d.getTime()) ? null : d },
  // US: 3/1/2024 or 03/01/2024
  (s) => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) return null
    const d = new Date(+m[3], +m[1] - 1, +m[2])
    return isNaN(d.getTime()) ? null : d
  },
  // Short US: 3/1/24
  (s) => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
    if (!m) return null
    const year = +m[3] + 2000
    const d = new Date(year, +m[1] - 1, +m[2])
    return isNaN(d.getTime()) ? null : d
  },
]

function parseDate(raw: string): string | null {
  const s = raw.trim()
  for (const parser of DATE_PATTERNS) {
    const d = parser(s)
    if (d) return d.toISOString().slice(0, 10)  // YYYY-MM-DD
  }
  return null
}

export interface NormalizeResult {
  validRows:  ValidatedSalesRow[]
  rowErrors:  Array<{ rowIndex: number; message: string }>
  truncated:  boolean
}

export function normalizeRows(
  rows: Record<string, string>[],
  mapping: FieldMapping,
): NormalizeResult {
  const validRows: ValidatedSalesRow[]                          = []
  const rowErrors: Array<{ rowIndex: number; message: string }> = []
  const truncated = rows.length > MAX_ROWS

  const capped = truncated ? rows.slice(0, MAX_ROWS) : rows

  for (let i = 0; i < capped.length; i++) {
    const row    = capped[i]
    const rowNum = i + 2  // 1-indexed, +1 for header

    // Required: date
    const rawDate = row[mapping.date] ?? ''
    const date    = parseDate(rawDate)
    if (!date) {
      rowErrors.push({ rowIndex: i, message: `Row ${rowNum}: unrecognized date format "${rawDate}"` })
      continue
    }

    // Required: item_name
    const itemName = (row[mapping.item_name] ?? '').trim()
    if (!itemName) {
      rowErrors.push({ rowIndex: i, message: `Row ${rowNum}: missing item_name` })
      continue
    }

    // Required: quantity_sold
    const qtyRaw  = row[mapping.quantity_sold] ?? ''
    const quantity = parseFloatSafe(qtyRaw)
    if (quantity === null || quantity < 0) {
      rowErrors.push({ rowIndex: i, message: `Row ${rowNum}: invalid quantity "${qtyRaw}"` })
      continue
    }

    // Optional: gross_sales
    const grossRaw  = mapping.gross_sales ? row[mapping.gross_sales] : null
    const grossSales = grossRaw ? parseFloatSafe(grossRaw) : null

    // Optional: sale_timestamp (accept as-is; DB will validate on insert)
    const tsRaw        = mapping.sale_timestamp ? row[mapping.sale_timestamp] : null
    const saleTimestamp = tsRaw?.trim() || null

    // Optional: guest_count (must be non-negative integer)
    const guestRaw   = mapping.guest_count ? row[mapping.guest_count] : null
    const guestFloat = guestRaw ? parseFloatSafe(guestRaw) : null
    const guestCount = guestFloat !== null && guestFloat >= 0 ? Math.round(guestFloat) : null

    // Optional: check_id and station (trimmed strings)
    const checkId = mapping.check_id && row[mapping.check_id]
      ? row[mapping.check_id].trim() || null
      : null
    const station = mapping.station && row[mapping.station]
      ? row[mapping.station].trim() || null
      : null

    validRows.push({
      date,
      item_name:      itemName,
      quantity,
      gross_sales:    grossSales,
      sale_timestamp: saleTimestamp,
      guest_count:    guestCount,
      check_id:       checkId,
      station,
    })
  }

  return { validRows, rowErrors, truncated }
}
