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

  const validRows: { count_date: string; item_name: string; quantity: number; unit_type: string | null }[] = []
  const rowErrors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const countDate = row[mapping.count_date]
    const itemName = row[mapping.item_name]
    const qtyStr = row[mapping.quantity_on_hand]

    if (!countDate || !isValidDate(countDate)) { rowErrors.push(`Row ${i + 2}: invalid date`); continue }
    if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }
    const quantity = parseFloatSafe(qtyStr)
    if (quantity === null || quantity < 0) { rowErrors.push(`Row ${i + 2}: invalid quantity`); continue }

    const unitType = mapping.unit_type ? row[mapping.unit_type] || null : null
    validRows.push({ count_date: countDate, item_name: itemName, quantity, unit_type: unitType })
  }

  if (validRows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
  }

  const countDate = validRows[0].count_date

  const { data: upload, error: uploadError } = await supabase
    .from('inventory_count_uploads')
    .insert({ business_id: DEMO_BUSINESS_ID, filename: file.name, count_date: countDate, row_count: validRows.length })
    .select()
    .single()

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const counts = await Promise.all(
    validRows.map(async (r) => {
      const inventoryItemId = await resolveInventoryItemId(r.item_name)
      return {
        upload_id: upload.id,
        business_id: DEMO_BUSINESS_ID,
        count_date: r.count_date,
        raw_item_name: r.item_name,
        inventory_item_id: inventoryItemId,
        quantity_on_hand: r.quantity,
        unit_type: r.unit_type,
      }
    })
  )

  const { error: countError } = await supabase.from('inventory_counts').insert(counts)
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  const unresolved = [...new Set(counts.filter((c) => !c.inventory_item_id).map((c) => c.raw_item_name))]

  return NextResponse.json({ upload_id: upload.id, rows_imported: validRows.length, unresolved_aliases: unresolved, row_errors: rowErrors })
}
