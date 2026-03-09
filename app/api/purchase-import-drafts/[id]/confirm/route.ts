import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

interface ConfirmLine {
  id: string
  raw_item_name: string
  inventory_item_id: string | null
  quantity: number | null
  unit_type: string | null
  unit_cost: number | null
  is_approved: boolean
  save_alias: boolean
}

interface ConfirmBody {
  vendor_name: string | null
  purchase_date: string | null
  lines: ConfirmLine[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await params
    const body: ConfirmBody = await req.json()

    const { data: draft, error: draftError } = await supabase
      .from('purchase_import_drafts')
      .select('id, document_upload_id, status')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (draftError) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    if (draft.status !== 'pending') {
      return NextResponse.json({ error: 'Draft has already been confirmed or cancelled' }, { status: 400 })
    }

    const approvedLines = body.lines.filter((l) => l.is_approved && l.raw_item_name)
    if (approvedLines.length === 0) {
      return NextResponse.json({ error: 'No approved lines to import' }, { status: 400 })
    }

    const purchaseDate = body.purchase_date ?? new Date().toISOString().slice(0, 10)

    const aliasLines = body.lines.filter((l) => l.save_alias && l.inventory_item_id && l.raw_item_name)
    for (const line of aliasLines) {
      await supabase
        .from('inventory_item_aliases')
        .upsert(
          { business_id: businessId, raw_name: line.raw_item_name, inventory_item_id: line.inventory_item_id },
          { onConflict: 'business_id,raw_name' }
        )
    }

    const { data: upload, error: uploadError } = await supabase
      .from('purchase_uploads')
      .insert({
        business_id: businessId,
        filename: `scan-import-${id.slice(0, 8)}`,
        period_start: purchaseDate,
        period_end: purchaseDate,
        row_count: approvedLines.length,
        document_upload_id: draft.document_upload_id,
      })
      .select()
      .single()

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const purchases = approvedLines.map((line) => ({
      upload_id: upload.id,
      business_id: businessId,
      purchase_date: purchaseDate,
      raw_item_name: line.raw_item_name,
      inventory_item_id: line.inventory_item_id,
      quantity_purchased: line.quantity ?? 0,
      vendor_name: body.vendor_name,
      unit_cost: line.unit_cost,
      unit_type: line.unit_type,
    }))

    const { error: purchasesError } = await supabase.from('purchases').insert(purchases)
    if (purchasesError) return NextResponse.json({ error: purchasesError.message }, { status: 500 })

    // ── Update stock levels: add received quantities to current on-hand ──────
    const matchedLines = approvedLines.filter((l) => l.inventory_item_id && (l.quantity ?? 0) > 0)
    if (matchedLines.length > 0) {
      const itemIds = matchedLines.map((l) => l.inventory_item_id!)

      // Get the latest count for each item
      const { data: latestCounts } = await supabase
        .from('inventory_counts')
        .select('inventory_item_id, quantity_on_hand')
        .eq('business_id', businessId)
        .in('inventory_item_id', itemIds)
        .order('count_date', { ascending: false })

      const latestByItem = new Map<string, number>()
      for (const c of latestCounts ?? []) {
        if (!latestByItem.has(c.inventory_item_id)) {
          latestByItem.set(c.inventory_item_id, c.quantity_on_hand)
        }
      }

      // Get item names/units for the count records
      const { data: invItems } = await supabase
        .from('inventory_items')
        .select('id, name, unit')
        .eq('business_id', businessId)
        .in('id', itemIds)

      const itemMeta = new Map<string, { name: string; unit: string }>()
      for (const item of invItems ?? []) itemMeta.set(item.id, { name: item.name, unit: item.unit })

      // Create a count upload record for this delivery
      const { data: countUpload } = await supabase
        .from('inventory_count_uploads')
        .insert({
          business_id: businessId,
          filename: `delivery-${id.slice(0, 8)}`,
          count_date: purchaseDate,
          row_count: matchedLines.length,
        })
        .select('id')
        .single()

      if (countUpload) {
        const countRecords = matchedLines.map((line) => {
          const prev = latestByItem.get(line.inventory_item_id!) ?? 0
          const meta = itemMeta.get(line.inventory_item_id!)
          return {
            upload_id: countUpload.id,
            business_id: businessId,
            count_date: purchaseDate,
            raw_item_name: line.raw_item_name,
            inventory_item_id: line.inventory_item_id,
            quantity_on_hand: prev + (line.quantity ?? 0),
            unit_type: line.unit_type ?? meta?.unit ?? null,
          }
        })
        await supabase.from('inventory_counts').insert(countRecords)
      }
    }

    await supabase
      .from('purchase_import_drafts')
      .update({ status: 'confirmed', vendor_name: body.vendor_name, purchase_date: purchaseDate, confirmed_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ upload_id: upload.id, rows_imported: approvedLines.length, aliases_saved: aliasLines.length })
  } catch (err: unknown) {
    return authErrorResponse(err)
  }
}
