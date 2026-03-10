import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { convertToOz, UNIT_TO_OZ } from '@/lib/conversions'

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()
    const [{ data: items }, { data: counts }] = await Promise.all([
      supabase
        .from('inventory_items')
        .select('id, name, unit, category, item_type, pack_size, package_type')
        .eq('business_id', businessId)
        .order('category', { nullsFirst: false })
        .order('name'),
      supabase
        .from('inventory_counts')
        .select('inventory_item_id, quantity_on_hand, count_date, unit_type')
        .eq('business_id', businessId)
        .order('count_date', { ascending: false }),
    ])

    const latestCountMap = new Map<string, { quantity_on_hand: number; count_date: string; unit_type: string | null }>()
    for (const c of counts ?? []) {
      if (c.inventory_item_id && !latestCountMap.has(c.inventory_item_id)) {
        latestCountMap.set(c.inventory_item_id, {
          quantity_on_hand: c.quantity_on_hand,
          count_date: c.count_date,
          unit_type: c.unit_type,
        })
      }
    }

    // --- Estimated stock calculation ---
    const inventoryItemIds = (items ?? []).map((i) => i.id)

    // Get all recipes that use our inventory items
    const { data: recipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')
      .in('inventory_item_id', inventoryItemIds.length > 0 ? inventoryItemIds : ['none'])

    // Build: inventory_item_id → [{ menu_item_id, oz_per_sale }]
    const recipesByInvItem: Record<string, Array<{ menu_item_id: string; oz_per_sale: number }>> = {}
    for (const r of recipes ?? []) {
      if (!recipesByInvItem[r.inventory_item_id]) recipesByInvItem[r.inventory_item_id] = []
      recipesByInvItem[r.inventory_item_id].push({
        menu_item_id: r.menu_item_id,
        oz_per_sale: convertToOz(r.quantity, r.unit),
      })
    }

    // Find earliest count date to scope sales/purchase queries
    const allCountDates = Array.from(latestCountMap.values()).map((c) => c.count_date).sort()
    const earliestDate = allCountDates[0] ?? null

    // Sales usage per menu_item_id per sale_date
    const salesMap: Record<string, Record<string, number>> = {}
    // Purchases per inventory_item_id
    const purchasesMap: Record<string, Array<{ quantity_oz: number; purchase_date: string }>> = {}

    if (earliestDate) {
      const itemUnitMap: Record<string, string> = {}
      for (const i of items ?? []) itemUnitMap[i.id] = i.unit

      const [{ data: salesData }, { data: purchasesData }] = await Promise.all([
        supabase
          .from('sales_transactions')
          .select('menu_item_id, quantity_sold, sale_date')
          .eq('business_id', businessId)
          .gte('sale_date', earliestDate)
          .not('menu_item_id', 'is', null),
        supabase
          .from('purchases')
          .select('inventory_item_id, quantity_purchased, unit_type, purchase_date')
          .eq('business_id', businessId)
          .gte('purchase_date', earliestDate)
          .not('inventory_item_id', 'is', null),
      ])

      for (const s of salesData ?? []) {
        if (!s.menu_item_id) continue
        if (!salesMap[s.menu_item_id]) salesMap[s.menu_item_id] = {}
        salesMap[s.menu_item_id][s.sale_date] = (salesMap[s.menu_item_id][s.sale_date] ?? 0) + (s.quantity_sold ?? 0)
      }

      for (const p of purchasesData ?? []) {
        if (!purchasesMap[p.inventory_item_id]) purchasesMap[p.inventory_item_id] = []
        const unit = p.unit_type ?? itemUnitMap[p.inventory_item_id] ?? 'oz'
        purchasesMap[p.inventory_item_id].push({
          quantity_oz: convertToOz(p.quantity_purchased, unit),
          purchase_date: p.purchase_date,
        })
      }
    }

    const result = (items ?? []).map((item) => {
      const count = latestCountMap.get(item.id) ?? null

      let estimated_qty: number | null = null
      let has_estimate = false

      if (count && recipesByInvItem[item.id]?.length > 0) {
        const lastCountDate = count.count_date
        const countUnit = count.unit_type ?? item.unit
        const lastCountOz = convertToOz(count.quantity_on_hand, countUnit)

        // Purchases since last count
        const purchasedOz = (purchasesMap[item.id] ?? [])
          .filter((p) => p.purchase_date > lastCountDate)
          .reduce((s, p) => s + p.quantity_oz, 0)

        // Sales usage since last count
        let usedOz = 0
        for (const recipe of recipesByInvItem[item.id]) {
          const datesMap = salesMap[recipe.menu_item_id]
          if (!datesMap) continue
          for (const [date, qty] of Object.entries(datesMap)) {
            if (date > lastCountDate) {
              usedOz += qty * recipe.oz_per_sale
            }
          }
        }

        const estimatedOz = lastCountOz + purchasedOz - usedOz
        const unitFactor = UNIT_TO_OZ[item.unit.toLowerCase().trim()] ?? null

        if (unitFactor) {
          estimated_qty = Math.max(0, estimatedOz / unitFactor)
        } else {
          // Food / non-liquid: usage is in native units (not oz), recalculate
          let nativeUsed = 0
          for (const recipe of recipesByInvItem[item.id]) {
            const datesMap = salesMap[recipe.menu_item_id]
            if (!datesMap) continue
            for (const [date, qty] of Object.entries(datesMap)) {
              if (date > lastCountDate) nativeUsed += qty * recipe.oz_per_sale
            }
          }
          estimated_qty = Math.max(0, count.quantity_on_hand - nativeUsed)
        }

        has_estimate = true
      }

      return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        item_type: item.item_type,
        pack_size: item.pack_size,
        package_type: item.package_type,
        quantity_on_hand: count?.quantity_on_hand ?? null,
        count_date: count?.count_date ?? null,
        estimated_qty,
        has_estimate,
      }
    })

    return NextResponse.json(result)
  } catch (e) { return authErrorResponse(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id, name, unit, category, quantity_on_hand } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const itemUpdates: Record<string, string | null> = {}
    if (name !== undefined) itemUpdates.name = name.trim()
    if (unit !== undefined) itemUpdates.unit = unit
    if (category !== undefined) itemUpdates.category = category || null

    if (Object.keys(itemUpdates).length > 0) {
      const { error } = await supabase
        .from('inventory_items')
        .update(itemUpdates)
        .eq('id', id)
        .eq('business_id', businessId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (quantity_on_hand !== null && quantity_on_hand !== undefined) {
      const today = new Date().toISOString().slice(0, 10)

      const { data: upload, error: uploadError } = await supabase
        .from('inventory_count_uploads')
        .insert({ business_id: businessId, filename: 'Manual adjustment', count_date: today, row_count: 1 })
        .select('id')
        .single()
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

      const { data: item } = await supabase
        .from('inventory_items')
        .select('name, unit')
        .eq('id', id)
        .single()

      const { error: countError } = await supabase
        .from('inventory_counts')
        .insert({
          upload_id: upload.id,
          business_id: businessId,
          count_date: today,
          raw_item_name: item?.name ?? '',
          inventory_item_id: id,
          quantity_on_hand: Number(quantity_on_hand),
          unit_type: item?.unit ?? null,
        })
      if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
