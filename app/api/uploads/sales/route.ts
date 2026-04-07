import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { isValidDate, parseFloatSafe } from '@/lib/validation'
import { runSalesImport } from '@/lib/sales-import/service'
import type { ValidatedSalesRow } from '@/lib/sales-import/types'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file || !mappingRaw) {
      return NextResponse.json({ error: 'file and mapping are required' }, { status: 400 })
    }

    const mapping: Record<string, string> = JSON.parse(mappingRaw)
    const text = await file.text()
    const { rows, errors } = parseCsvText(text)

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'CSV parse failed', details: errors }, { status: 400 })
    }

    const validRows: ValidatedSalesRow[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const date     = row[mapping.date]
      const itemName = row[mapping.item_name]
      const qtyStr   = row[mapping.quantity_sold]

      if (!date || !isValidDate(date)) { rowErrors.push(`Row ${i + 2}: invalid date "${date}"`); continue }
      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }
      const quantity = parseFloatSafe(qtyStr)
      if (quantity === null || quantity < 0) { rowErrors.push(`Row ${i + 2}: invalid quantity "${qtyStr}"`); continue }

      const grossSales    = mapping.gross_sales    ? parseFloatSafe(row[mapping.gross_sales])    : null
      const rawTimestamp  = mapping.sale_timestamp ? row[mapping.sale_timestamp]                 : null
      const saleTimestamp = rawTimestamp?.trim() || null
      const rawGuest      = mapping.guest_count    ? parseFloatSafe(row[mapping.guest_count])    : null
      const guestCount    = rawGuest !== null && rawGuest >= 0 ? Math.round(rawGuest) : null
      const checkId       = mapping.check_id && row[mapping.check_id] ? row[mapping.check_id].trim() || null : null
      const station       = mapping.station  && row[mapping.station]  ? row[mapping.station].trim()  || null : null

      validRows.push({ date, item_name: itemName, quantity, gross_sales: grossSales, sale_timestamp: saleTimestamp, guest_count: guestCount, check_id: checkId, station })
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    const result = await runSalesImport(supabase, businessId, file.name, validRows)

    return NextResponse.json({ ...result, row_errors: rowErrors })
  } catch (e) { return authErrorResponse(e) }
}
