import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { parseFloatSafe } from '@/lib/validation'
import { resolveInventoryItemId } from '@/lib/aliases'
import { logError } from '@/lib/logger'

const ROUTE = 'onboarding/csv-prices'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file || !mappingRaw) {
      return NextResponse.json({ error: 'file and mapping are required' }, { status: 400 })
    }

    const MAX_FILE_BYTES = 10_000_000
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    const mapping: Record<string, string> = JSON.parse(mappingRaw)
    const text = await file.text()
    const { rows, errors } = parseCsvText(text)

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'CSV parse failed', details: errors }, { status: 400 })
    }

    const MAX_ROWS = 5_000
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows. Maximum is ${MAX_ROWS}.` }, { status: 400 })
    }

    const parsed: {
      raw_item_name: string
      unit_cost: number | null
      unit_type: string | null
      quantity: number | null
    }[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const itemName = row[mapping.item_name]?.trim()
      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item name`); continue }

      const cost = mapping.unit_cost ? parseFloatSafe(row[mapping.unit_cost]) : null
      const qty  = mapping.quantity  ? parseFloatSafe(row[mapping.quantity])  : null

      // Need at least a price or a quantity to be useful
      if (cost === null && qty === null) {
        rowErrors.push(`Row ${i + 2}: no price or quantity found`); continue
      }

      parsed.push({
        raw_item_name: itemName,
        unit_cost:  cost,
        unit_type:  mapping.unit_type ? row[mapping.unit_type] || null : null,
        quantity:   qty,
      })
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    // Deduplicate by name (last row wins)
    const seen = new Map<string, typeof parsed[0]>()
    for (const p of parsed) seen.set(p.raw_item_name, p)
    const deduped = Array.from(seen.values())

    // Check which items already exist
    const items = await Promise.all(
      deduped.map(async (p) => {
        const existingId = await resolveInventoryItemId(p.raw_item_name, supabase, businessId)
        return { ...p, is_new: !existingId }
      })
    )

    return NextResponse.json({ items, row_errors: rowErrors })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
