import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { parseFloatSafe } from '@/lib/validation'
import { logError } from '@/lib/logger'

const ROUTE = 'onboarding/csv-prices'

export async function POST(req: NextRequest) {
  try {
    await getAuthContext() // auth check only — no DB writes

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

    const items: { raw_item_name: string; unit_cost: number; unit_type: string | null }[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const itemName = row[mapping.item_name]?.trim()
      const costStr = row[mapping.unit_cost]

      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item name`); continue }

      const cost = parseFloatSafe(costStr)
      if (cost === null || cost <= 0) { rowErrors.push(`Row ${i + 2}: invalid cost "${costStr}"`); continue }

      items.push({
        raw_item_name: itemName,
        unit_cost: cost,
        unit_type: mapping.unit_type ? row[mapping.unit_type] || null : null,
      })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    // Deduplicate — keep last occurrence per item name (latest price wins)
    const seen = new Map<string, (typeof items)[0]>()
    for (const item of items) seen.set(item.raw_item_name, item)

    return NextResponse.json({
      items: Array.from(seen.values()),
      row_errors: rowErrors,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
    })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
