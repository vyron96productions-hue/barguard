import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import { parseCsvText } from '@/lib/csv'
import { resolveMenuItemId } from '@/lib/aliases'
import { isValidDate, parseFloatSafe } from '@/lib/validation'

export async function POST(req: NextRequest) {
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

  const validRows: { date: string; item_name: string; quantity: number; gross_sales: number | null }[] = []
  const rowErrors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const date = row[mapping.date]
    const itemName = row[mapping.item_name]
    const qtyStr = row[mapping.quantity_sold]

    if (!date || !isValidDate(date)) { rowErrors.push(`Row ${i + 2}: invalid date "${date}"`); continue }
    if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }
    const quantity = parseFloatSafe(qtyStr)
    if (quantity === null || quantity < 0) { rowErrors.push(`Row ${i + 2}: invalid quantity "${qtyStr}"`); continue }

    const grossSales = mapping.gross_sales ? parseFloatSafe(row[mapping.gross_sales]) : null
    validRows.push({ date, item_name: itemName, quantity, gross_sales: grossSales })
  }

  if (validRows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
  }

  const allDates = validRows.map((r) => r.date).sort()
  const periodStart = allDates[0]
  const periodEnd = allDates[allDates.length - 1]

  // Create upload record
  const { data: upload, error: uploadError } = await supabase
    .from('sales_uploads')
    .insert({ business_id: DEMO_BUSINESS_ID, filename: file.name, period_start: periodStart, period_end: periodEnd, row_count: validRows.length })
    .select()
    .single()

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Resolve menu item IDs and insert transactions
  const transactions = await Promise.all(
    validRows.map(async (r) => {
      const menuItemId = await resolveMenuItemId(r.item_name)
      return {
        upload_id: upload.id,
        business_id: DEMO_BUSINESS_ID,
        sale_date: r.date,
        raw_item_name: r.item_name,
        menu_item_id: menuItemId,
        quantity_sold: r.quantity,
        gross_sales: r.gross_sales,
      }
    })
  )

  const { error: txError } = await supabase.from('sales_transactions').insert(transactions)
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  const unresolved = transactions.filter((t) => !t.menu_item_id).map((t) => t.raw_item_name)
  const uniqueUnresolved = [...new Set(unresolved)]

  return NextResponse.json({
    upload_id: upload.id,
    rows_imported: validRows.length,
    unresolved_aliases: uniqueUnresolved,
    row_errors: rowErrors,
  })
}
