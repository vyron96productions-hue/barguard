/**
 * CSV header template detection.
 *
 * Maps raw CSV headers to canonical field names based on the supported alias list.
 * Returns a FieldMapping (canonical field → actual CSV header) or null if
 * the headers cannot be resolved to a supported template.
 */

import type { FieldMapping } from './types'

// Canonical field → accepted header aliases (all lowercase)
const HEADER_ALIASES: Record<string, string[]> = {
  date:           ['date', 'sale_date'],
  item_name:      ['item_name', 'item', 'menu_item', 'product_name'],
  quantity_sold:  ['quantity_sold', 'qty', 'quantity'],
  gross_sales:    ['gross_sales', 'gross', 'sales_total'],
  sale_timestamp: ['sale_timestamp', 'timestamp', 'sold_at'],
  guest_count:    ['guest_count', 'covers'],
  check_id:       ['check_id', 'order_id', 'ticket_id'],
  station:        ['station', 'terminal', 'register'],
}

const REQUIRED_FIELDS = ['date', 'item_name', 'quantity_sold']

/**
 * Attempt to resolve a CSV header list to a canonical field mapping.
 *
 * @param headers  Raw headers from parseCsvText (already trimmed)
 * @returns        FieldMapping on success, null if required fields cannot be resolved.
 */
export function detectTemplate(headers: string[]): FieldMapping | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
  const mapping: FieldMapping = {}

  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias)
      if (idx !== -1) {
        mapping[canonical] = headers[idx]  // use original casing for CSV lookup
        break
      }
    }
  }

  // All required fields must resolve
  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field]) return null
  }

  return mapping
}
