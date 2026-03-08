import { NextRequest, NextResponse } from 'next/server'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'
import { parseCsvText } from '@/lib/csv'
import { resolveInventoryItemId } from '@/lib/aliases'
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

  const validRows: { purchase_date: string; item_name: string; quantity: number; vendor: string | null; unit_cost: number | null; unit_type: string | null }[] = []
  const rowErrors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const purchaseDate = row[mapping.purchase_date]
    const itemName = row[mapping.item_name]
    const qtyStr = row[mapping.quantity_purchased]

    if (!purchaseDate || !isValidDate(purchaseDate)) { rowErrors.push(`Row ${i + 2}: invalid date`); continue }
    if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }
    const quantity = parseFloatSafe(qtyStr)
    if (quantity === null || quantity <= 0) { rowErrors.push(`Row ${i + 2}: invalid quantity`); continue }

    validRows.push({
      purchase_date: purchaseDate,
      item_name: itemName,
      quantity,
      vendor: mapping.vendor_name ? row[mapping.vendor_name] || null : null,
      unit_cost: mapping.unit_cost ? parseFloatSafe(row[mapping.unit_cost]) : null,
      unit_type: mapping.unit_type ? row[mapping.unit_type] || null : null,
    })
  }

  if (validRows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
  }

  const allDates = validRows.map((r) => r.purchase_date).sort()

  const { data: upload, error: uploadError } = await supabase
    .from('purchase_uploads')
    .insert({ business_id: DEMO_BUSINESS_ID, filename: file.name, period_start: allDates[0], period_end: allDates[allDates.length - 1], row_count: validRows.length })
    .select()
    .single()

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const purchases = await Promise.all(
    validRows.map(async (r) => {
      const inventoryItemId = await resolveInventoryItemId(r.item_name)
      return {
        upload_id: upload.id,
        business_id: DEMO_BUSINESS_ID,
        purchase_date: r.purchase_date,
        raw_item_name: r.item_name,
        inventory_item_id: inventoryItemId,
        quantity_purchased: r.quantity,
        vendor_name: r.vendor,
        unit_cost: r.unit_cost,
        unit_type: r.unit_type,
      }
    })
  )

  const { error: purchaseError } = await supabase.from('purchases').insert(purchases)
  if (purchaseError) return NextResponse.json({ error: purchaseError.message }, { status: 500 })

  const unresolved = [...new Set(purchases.filter((p) => !p.inventory_item_id).map((p) => p.raw_item_name))]

  return NextResponse.json({ upload_id: upload.id, rows_imported: validRows.length, unresolved_aliases: unresolved, row_errors: rowErrors })
}
