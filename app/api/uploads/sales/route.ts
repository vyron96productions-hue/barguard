import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { isValidDate, parseFloatSafe } from '@/lib/validation'
import { runSalesImport } from '@/lib/sales-import/service'
import type { ValidatedSalesRow } from '@/lib/sales-import/types'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'uploads/sales'

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

    // Reject duplicate uploads — same file content for the same business
    const contentHash = createHash('sha256').update(text).digest('hex')
    const { data: existingUpload } = await supabase
      .from('sales_uploads')
      .select('id, filename, period_start, period_end')
      .eq('business_id', businessId)
      .eq('content_hash', contentHash)
      .maybeSingle()
    if (existingUpload) {
      logger.warn(ROUTE, 'Duplicate upload rejected', { businessId, filename: file.name, contentHash, existing_upload_id: existingUpload.id })
      return NextResponse.json({
        error: `This file has already been imported (${existingUpload.filename}, ${existingUpload.period_start} – ${existingUpload.period_end}). Uploading it again would double-count every sale.`,
      }, { status: 409 })
    }

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
      logger.warn(ROUTE, 'No valid rows', { businessId, filename: file.name, row_errors: rowErrors.length })
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    logger.info(ROUTE, 'Importing sales', { businessId, filename: file.name, valid_rows: validRows.length, row_errors: rowErrors.length })
    const result = await runSalesImport(supabase, businessId, file.name, validRows, undefined, contentHash)
    logger.info(ROUTE, 'Import complete', { businessId, ...result })

    return NextResponse.json({ ...result, row_errors: rowErrors })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
