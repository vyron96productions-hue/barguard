import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { resolveInventoryItemId } from '@/lib/aliases'
import { isValidDate, parseFloatSafe } from '@/lib/validation'
import { parseQuantityString, normalizeUnitType, computeEffectiveQuantity } from '@/lib/beer-packaging'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'uploads/purchases'

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

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

    const validRows: { purchase_date: string; item_name: string; quantity: number; vendor: string | null; unit_cost: number | null; unit_type: string | null }[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const purchaseDate = row[mapping.purchase_date]
      const itemName = row[mapping.item_name]
      const qtyStr = row[mapping.quantity_purchased]

      if (!purchaseDate || !isValidDate(purchaseDate)) { rowErrors.push(`Row ${i + 2}: invalid date`); continue }
      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }

      const parsed = parseQuantityString(qtyStr)
      const rawQty = parsed.quantity ?? parseFloatSafe(qtyStr)
      if (rawQty === null || rawQty <= 0) { rowErrors.push(`Row ${i + 2}: invalid quantity "${qtyStr}"`); continue }

      const rawUnitType = mapping.unit_type ? row[mapping.unit_type] || null : null
      const normalizedUnit = rawUnitType ? normalizeUnitType(rawUnitType) : null
      const unitsPerPackage = parsed.unitsPerPackage ?? normalizedUnit?.unitsPerPackage ?? null
      const canonicalUnit = normalizedUnit?.unit ?? rawUnitType

      const effectiveQty = computeEffectiveQuantity(rawQty, unitsPerPackage)

      validRows.push({
        purchase_date: purchaseDate,
        item_name: itemName,
        quantity: effectiveQty,
        vendor: mapping.vendor_name ? row[mapping.vendor_name] || null : null,
        unit_cost: mapping.unit_cost ? parseFloatSafe(row[mapping.unit_cost]) : null,
        unit_type: canonicalUnit,
      })
    }

    if (validRows.length === 0) {
      logger.warn(ROUTE, 'No valid rows', { businessId, filename: file.name, row_errors: rowErrors.length })
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    logger.info(ROUTE, 'Importing purchases', { businessId, filename: file.name, valid_rows: validRows.length })

    const allDates = validRows.map((r) => r.purchase_date).sort()

    const { data: upload, error: uploadError } = await supabase
      .from('purchase_uploads')
      .insert({ business_id: businessId, filename: file.name, period_start: allDates[0], period_end: allDates[allDates.length - 1], row_count: validRows.length })
      .select()
      .single()

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const purchases = await Promise.all(
      validRows.map(async (r) => {
        const inventoryItemId = await resolveInventoryItemId(r.item_name, supabase, businessId)
        return {
          upload_id: upload.id,
          business_id: businessId,
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

    // ── Update inventory_counts: add received quantities to current on-hand ────
    // Same logic as purchase-scan confirm — without this the stock page never reflects the delivery
    const matchedPurchases = purchases.filter((p) => p.inventory_item_id)
    if (matchedPurchases.length > 0) {
      const itemIds = [...new Set(matchedPurchases.map((p) => p.inventory_item_id!))]

      // Latest count per item
      const { data: latestCounts } = await supabase
        .from('inventory_counts')
        .select('inventory_item_id, quantity_on_hand, unit_type')
        .eq('business_id', businessId)
        .in('inventory_item_id', itemIds)
        .order('count_date', { ascending: false })

      const latestByItem = new Map<string, { qty: number; unit: string | null }>()
      for (const c of latestCounts ?? []) {
        if (!latestByItem.has(c.inventory_item_id)) {
          latestByItem.set(c.inventory_item_id, { qty: c.quantity_on_hand, unit: c.unit_type })
        }
      }

      // Item unit metadata for new count records
      const { data: invItems } = await supabase
        .from('inventory_items')
        .select('id, unit')
        .eq('business_id', businessId)
        .in('id', itemIds)

      const itemUnit = new Map<string, string>()
      for (const item of invItems ?? []) itemUnit.set(item.id, item.unit)

      // Create a count-upload record so the delivery appears in count history
      const allDates2 = matchedPurchases.map((p) => p.purchase_date).sort()
      const { data: countUpload } = await supabase
        .from('inventory_count_uploads')
        .insert({
          business_id: businessId,
          filename: `delivery-${upload.id.slice(0, 8)}`,
          count_date: allDates2[allDates2.length - 1], // use latest purchase date
          row_count: matchedPurchases.length,
        })
        .select('id')
        .single()

      if (countUpload) {
        // Aggregate by item (multiple purchase rows may hit same item)
        const qtyByItem = new Map<string, { qty: number; unit: string | null; name: string }>()
        for (const p of matchedPurchases) {
          const id = p.inventory_item_id!
          const existing = qtyByItem.get(id)
          qtyByItem.set(id, {
            qty: (existing?.qty ?? 0) + p.quantity_purchased,
            unit: p.unit_type ?? existing?.unit ?? null,
            name: p.raw_item_name,
          })
        }

        const countRecords = Array.from(qtyByItem.entries()).map(([itemId, info]) => {
          const prev = latestByItem.get(itemId)?.qty ?? 0
          const unit = info.unit ?? itemUnit.get(itemId) ?? null
          return {
            upload_id: countUpload.id,
            business_id: businessId,
            count_date: allDates2[allDates2.length - 1],
            raw_item_name: info.name,
            inventory_item_id: itemId,
            quantity_on_hand: prev + info.qty,
            unit_type: unit,
          }
        })

        await supabase
          .from('inventory_counts')
          .upsert(countRecords, { onConflict: 'business_id,inventory_item_id,count_date' })
      }

      // Update cost_per_unit on inventory items when the CSV has a price column
      const priceByItem = new Map<string, number>()
      for (const p of matchedPurchases) {
        if (p.inventory_item_id && p.unit_cost != null && p.unit_cost > 0) {
          priceByItem.set(p.inventory_item_id, p.unit_cost)
        }
      }
      for (const [itemId, cost] of priceByItem.entries()) {
        await supabase
          .from('inventory_items')
          .update({ cost_per_unit: cost })
          .eq('id', itemId)
          .eq('business_id', businessId)
      }
    }

    const unresolved = [...new Set(purchases.filter((p) => !p.inventory_item_id).map((p) => p.raw_item_name))]

    logger.info(ROUTE, 'Import complete', { businessId, rows_imported: validRows.length, unresolved: unresolved.length })
    return NextResponse.json({ upload_id: upload.id, rows_imported: validRows.length, unresolved_aliases: unresolved, row_errors: rowErrors })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
