import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { resolveInventoryItemId } from '@/lib/aliases'
import { logger, logError } from '@/lib/logger'
import { localDateFromClient } from '@/lib/dates'
import type { ScanType } from '@/lib/document-extraction'

const ROUTE = 'onboarding/apply-prices'

// Default unit when creating new items, keyed by scan type
const DEFAULT_UNIT: Record<ScanType, string> = {
  liquor:   'bottle',
  food:     'lb',
  supplies: 'each',
}

// Default item_type when creating new items, keyed by scan type
const DEFAULT_ITEM_TYPE: Record<ScanType, string> = {
  liquor:   'beverage',
  food:     'food',
  supplies: 'beverage',
}

interface PriceEntry {
  raw_item_name:     string
  unit_cost:         number | null    // price as entered — may be per-case for food+lb items
  units_per_package: number | null    // lbs/case or units/pack — used to convert cost to per-unit
  quantity_on_hand:  number | null    // initial stock to set (null / 0 = skip stock)
  unit_type:         string | null    // extracted unit — used as item unit when creating new
  item_type:         string | null    // 'beverage' | 'food' — user-selected for new items
  is_new:            boolean          // whether the review step flagged this as a new item
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const body = await req.json()
    const entries: PriceEntry[] = body.entries
    const scanType: ScanType = body.scan_type ?? 'liquor'
    const today = localDateFromClient(body.local_date)

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
    }

    let updated  = 0
    let created  = 0
    let stockSet = 0
    const failed: string[] = []

    // Collect items that need stock records
    const stockEntries: { itemId: string; name: string; qty: number; unit: string | null }[] = []

    for (const entry of entries) {
      try {
        // ── 1. Resolve or create inventory item ───────────────────────────
        let itemId = await resolveInventoryItemId(entry.raw_item_name, supabase, businessId)

        if (!itemId) {
          // Determine unit for the new item
          const unit = entry.unit_type || DEFAULT_UNIT[scanType]
          const itemType = entry.item_type || DEFAULT_ITEM_TYPE[scanType]

          const { data: newItem, error: createErr } = await supabase
            .from('inventory_items')
            .insert({
              business_id: businessId,
              name:        entry.raw_item_name.trim(),
              unit,
              item_type:   itemType,
            })
            .select('id')
            .single()

          if (createErr || !newItem) {
            failed.push(entry.raw_item_name)
            continue
          }

          itemId = newItem.id
          created++
        }

        // ── 2. Update cost_per_unit ────────────────────────────────────────
        if (entry.unit_cost !== null && entry.unit_cost > 0) {
          // Food + lb + known lbs-per-case: divide to get per-lb cost
          const { data: item } = await supabase
            .from('inventory_items')
            .select('item_type, unit, pack_size')
            .eq('id', itemId)
            .eq('business_id', businessId)
            .single()

          const upp = entry.units_per_package ?? (item?.pack_size ?? null)
          let costPerUnit = entry.unit_cost
          if (item?.item_type === 'food' && item?.unit === 'lb' && upp != null && upp > 1) {
            costPerUnit = entry.unit_cost / upp
          }

          await supabase
            .from('inventory_items')
            .update({ cost_per_unit: costPerUnit })
            .eq('id', itemId)
            .eq('business_id', businessId)

          updated++
        }

        // ── 3. Collect stock entries ───────────────────────────────────────
        const qty = entry.quantity_on_hand
        if (qty !== null && qty > 0 && itemId) {
          stockEntries.push({
            itemId: itemId as string,
            name: entry.raw_item_name,
            qty,
            unit: entry.unit_type ?? null,
          })
        }
      } catch {
        failed.push(entry.raw_item_name)
      }
    }

    // ── 4. Write initial inventory counts ─────────────────────────────────
    if (stockEntries.length > 0) {

      // Create one count-upload record for this onboarding batch
      const { data: countUpload } = await supabase
        .from('inventory_count_uploads')
        .insert({
          business_id: businessId,
          filename:    'initial-setup',
          count_date:  today,
          row_count:   stockEntries.length,
        })
        .select('id')
        .single()

      if (countUpload) {
        const countRecords = stockEntries.map((s) => ({
          upload_id:        countUpload.id,
          business_id:      businessId,
          count_date:       today,
          raw_item_name:    s.name,
          inventory_item_id: s.itemId,
          quantity_on_hand: s.qty,
          unit_type:        s.unit,
        }))

        const { error: countErr } = await supabase
          .from('inventory_counts')
          .upsert(countRecords, { onConflict: 'business_id,inventory_item_id,count_date' })

        if (!countErr) stockSet = stockEntries.length
      }
    }

    logger.info(ROUTE, 'Onboarding apply complete', {
      businessId, created, updated, stockSet, failed: failed.length,
    })

    return NextResponse.json({ updated, created, stock_set: stockSet, failed })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
