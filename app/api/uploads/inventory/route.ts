import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { parseCsvText } from '@/lib/csv'
import { resolveInventoryItemId } from '@/lib/aliases'
import { isValidDate, parseFloatSafe } from '@/lib/validation'
import { parseQuantityString, normalizeUnitType, PACKAGE_TYPE_SIZES } from '@/lib/beer-packaging'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'uploads/inventory'

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'manager')
    const { supabase, businessId } = ctx

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file || !mappingRaw) {
      return NextResponse.json({ error: 'file and mapping are required' }, { status: 400 })
    }

    const MAX_FILE_BYTES = 10_000_000 // 10 MB
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    const mapping: Record<string, string> = JSON.parse(mappingRaw)
    const text = await file.text()
    const { rows, errors } = parseCsvText(text)

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'CSV parse failed', details: errors }, { status: 400 })
    }

    const MAX_ROWS = 10_000
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows. Maximum is ${MAX_ROWS} per upload.` }, { status: 400 })
    }

    const validRows: { count_date: string; item_name: string; quantity: number; unit_type: string | null; category: string | null; cost_per_unit: number | null }[] = []
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

      const rawCategory = mapping.category ? row[mapping.category]?.trim() || null : null
      const rawCost = mapping.cost_per_unit ? row[mapping.cost_per_unit] : null
      const costPerUnit = rawCost ? parseFloatSafe(rawCost) : null

      validRows.push({ count_date: countDate, item_name: itemName, quantity, unit_type: unitType, category: rawCategory, cost_per_unit: costPerUnit })
    }

    if (validRows.length === 0) {
      logger.warn(ROUTE, 'No valid rows', { businessId, filename: file.name, row_errors: rowErrors.length })
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    logger.info(ROUTE, 'Importing inventory count', { businessId, filename: file.name, valid_rows: validRows.length })

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
          const WINE_KEYWORDS = /\b(wine|chardonnay|merlot|cabernet|cab\s*sav|pinot|sauvignon|blanc|rouge|riesling|malbec|shiraz|syrah|zinfandel|prosecco|champagne|cava|moscato|rosé|rose|bordeaux|burgundy|chianti|rioja|albariño|viognier|grenache|tempranillo)\b/i
          let unit = r.unit_type ?? 'bottle'
          // If CSV gave us a plain 750ml unit, check the item name for wine keywords
          if (unit === 'bottle' && WINE_KEYWORDS.test(r.item_name)) {
            unit = 'wine_bottle'
          }
          const foodUnits = new Set(['lb', 'kg', 'g', 'each', 'piece', 'portion', 'serving', 'slice', 'tray', 'flat', 'bag', 'jar', 'packet', 'cup', 'tbsp', 'tsp'])
          const item_type = foodUnits.has(unit) ? 'food' : 'beverage'
          const packMeta: { pack_size: number; package_type: string } | null =
            unit === 'case'       ? { pack_size: PACKAGE_TYPE_SIZES['case'], package_type: 'case' } :
            unit === 'keg'        ? { pack_size: PACKAGE_TYPE_SIZES['keg'],  package_type: 'keg' } :
            unit === 'quarterkeg' ? { pack_size: 62,                         package_type: 'quarter keg' } :
            unit === 'sixthkeg'   ? { pack_size: 41,                         package_type: 'sixth keg' } :
            null
          const newItemPayload: Record<string, unknown> = { business_id: businessId, name: r.item_name, unit, item_type, ...packMeta }
          if (r.category) newItemPayload.category = r.category
          if (r.cost_per_unit !== null) newItemPayload.cost_per_unit = r.cost_per_unit
          const { data: newItem } = await supabase
            .from('inventory_items')
            .insert(newItemPayload)
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

    logger.info(ROUTE, 'Import complete', { businessId, rows_imported: validRows.length, items_created: itemsCreated, unresolved: unresolved.length })
    return NextResponse.json({ upload_id: upload.id, rows_imported: validRows.length, items_created: itemsCreated, unresolved_aliases: unresolved, row_errors: rowErrors })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
