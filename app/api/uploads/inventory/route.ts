import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { resolveInventoryItemId } from '@/lib/aliases'
import { isValidDate, parseFloatSafe } from '@/lib/validation'
import { parseQuantityString, normalizeUnitType } from '@/lib/beer-packaging'

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

    const validRows: { count_date: string; item_name: string; quantity: number; unit_type: string | null }[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const countDate = row[mapping.count_date]
      const itemName = row[mapping.item_name]
      const qtyStr = row[mapping.quantity_on_hand]

      if (!countDate || !isValidDate(countDate)) { rowErrors.push(`Row ${i + 2}: invalid date`); continue }
      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }

      const parsed = parseQuantityString(qtyStr)
      const quantity = parsed.quantity ?? parseFloatSafe(qtyStr)
      if (quantity === null || quantity < 0) { rowErrors.push(`Row ${i + 2}: invalid quantity "${qtyStr}"`); continue }

      const rawUnitType = mapping.unit_type ? row[mapping.unit_type] || null : null
      const unitType = rawUnitType ? normalizeUnitType(rawUnitType).unit : null

      validRows.push({ count_date: countDate, item_name: itemName, quantity, unit_type: unitType })
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    const countDate = validRows[0].count_date

    const { data: upload, error: uploadError } = await supabase
      .from('inventory_count_uploads')
      .insert({ business_id: businessId, filename: file.name, count_date: countDate, row_count: validRows.length })
      .select()
      .single()

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    let itemsCreated = 0

    const counts = await Promise.all(
      validRows.map(async (r) => {
        let inventoryItemId = await resolveInventoryItemId(r.item_name, supabase, businessId)

        // Auto-create inventory item if it doesn't exist
        if (!inventoryItemId) {
          const unit = r.unit_type ?? 'bottle'
          const foodUnits = new Set(['lb', 'kg', 'g', 'each', 'piece', 'portion', 'serving', 'slice', 'tray', 'flat', 'bag', 'jar', 'packet', 'cup', 'tbsp', 'tsp'])
          const item_type = foodUnits.has(unit) ? 'food' : 'beverage'
          const packMeta: { pack_size: number; package_type: string } | null =
            unit === 'case' ? { pack_size: 24, package_type: 'case' } :
            unit === 'keg' ? { pack_size: 165, package_type: 'keg' } :
            unit === 'halfkeg' ? { pack_size: 82, package_type: 'half keg' } :
            unit === 'quarterkeg' ? { pack_size: 62, package_type: 'quarter keg' } :
            unit === 'sixthkeg' ? { pack_size: 41, package_type: 'sixth keg' } :
            null
          const { data: newItem } = await supabase
            .from('inventory_items')
            .insert({ business_id: businessId, name: r.item_name, unit, item_type, ...packMeta })
            .select('id')
            .single()

          if (newItem) {
            inventoryItemId = newItem.id
            itemsCreated++
          }
        }

        return {
          upload_id: upload.id,
          business_id: businessId,
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

    return NextResponse.json({ upload_id: upload.id, rows_imported: validRows.length, items_created: itemsCreated, unresolved_aliases: unresolved, row_errors: rowErrors })
  } catch (e) { return authErrorResponse(e) }
}
