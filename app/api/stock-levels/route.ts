import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { inferItemType } from '@/lib/categories'
import { calculateExpectedOnHand, earliestCountDate } from '@/lib/inventory-calc'

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

    // Latest count per item (for quantity_on_hand / count_date on the response)
    const latestCountMap = new Map<string, { quantity_on_hand: number; count_date: string }>()
    for (const c of counts ?? []) {
      if (c.inventory_item_id && !latestCountMap.has(c.inventory_item_id)) {
        latestCountMap.set(c.inventory_item_id, {
          quantity_on_hand: c.quantity_on_hand,
          count_date: c.count_date,
        })
      }
    }

    // Get all recipes for this business — RLS scopes to business via menu_item_id.
    // Do NOT filter by inventory_item_id here: with 700+ items the IN() list
    // exceeds PostgREST's URL length limit and the query silently returns nothing.
    const { data: recipes, error: recipesError } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')
    if (recipesError) {
      console.error('[stock-levels] recipes query failed:', recipesError.message)
    }

    const earliest = earliestCountDate(counts ?? [])

    let rawSales:     Array<{ menu_item_id: string | null; quantity_sold: number | null; sale_date: string }> = []
    let rawPurchases: Array<{ inventory_item_id: string | null; quantity_purchased: number; unit_type: string | null; purchase_date: string }> = []

    if (earliest) {
      // PostgREST default cap is 1000 rows — override to 100k so high-volume
      // bars with many daily transactions don't get silently truncated.
      const [{ data: salesData }, { data: purchasesData }] = await Promise.all([
        supabase
          .from('sales_transactions')
          .select('menu_item_id, quantity_sold, sale_date')
          .eq('business_id', businessId)
          .gte('sale_date', earliest)
          .not('menu_item_id', 'is', null)
          .limit(100000),
        supabase
          .from('purchases')
          .select('inventory_item_id, quantity_purchased, unit_type, purchase_date')
          .eq('business_id', businessId)
          .gte('purchase_date', earliest)
          .not('inventory_item_id', 'is', null)
          .limit(10000),
      ])
      rawSales     = salesData     ?? []
      rawPurchases = purchasesData ?? []
    }

    // Diagnostic: log key numbers so we can trace the Miller Lite calc
    const millerLiteItem = (items ?? []).find((i) => i.name === 'Miller Lite')
    const millerLightSales = rawSales.filter((s) => s.menu_item_id === 'f133e15f-116e-411e-a28b-005e7e5d0346')
    const millerLiteRecipes = (recipes ?? []).filter((r) => r.inventory_item_id === millerLiteItem?.id)
    console.log('[stock-levels:diag] earliest=%s rawSales=%d millerLite_id=%s millerLight_sales=%d millerLite_recipes=%d',
      earliest, rawSales.length, millerLiteItem?.id ?? 'NOT_FOUND', millerLightSales.length, millerLiteRecipes.length)
    if (millerLiteItem) {
      const lc = (counts ?? []).find((c) => c.inventory_item_id === millerLiteItem.id)
      console.log('[stock-levels:diag] millerLite count_date=%s qty=%s unit=%s',
        lc?.count_date, lc?.quantity_on_hand, millerLiteItem.unit)
    }

    const calcMap = calculateExpectedOnHand(
      items  ?? [],
      counts ?? [],
      rawPurchases,
      rawSales,
      recipes ?? [],
    )

    if (millerLiteItem) {
      const calc = calcMap.get(millerLiteItem.id)
      console.log('[stock-levels:diag] millerLite calc: has_estimate=%s has_recipe=%s estimated_qty=%s deductions_oz=%s',
        calc?.has_estimate, calc?.has_recipe, calc?.estimated_qty, calc?.deductions_since_oz)
    }

    const result = (items ?? []).map((item) => {
      const count = latestCountMap.get(item.id) ?? null
      const calc  = calcMap.get(item.id)
      return {
        id:               item.id,
        name:             item.name,
        unit:             item.unit,
        category:         item.category,
        item_type:        item.item_type,
        pack_size:        item.pack_size,
        package_type:     item.package_type,
        quantity_on_hand: count?.quantity_on_hand ?? null,
        count_date:       count?.count_date       ?? null,
        estimated_qty:    calc?.estimated_qty     ?? null,
        // Only show as "Live estimate" when a recipe is actively deducting sales.
        // Items with a count but no recipe show the physical count instead.
        has_estimate:     (calc?.has_estimate && calc?.has_recipe) ?? false,
      }
    })

    return NextResponse.json(result)
  } catch (e) { return authErrorResponse(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id, name, unit, category, quantity_on_hand, count_date: clientDate } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const itemUpdates: Record<string, string | null> = {}
    if (name !== undefined) itemUpdates.name = name.trim()
    if (unit !== undefined) itemUpdates.unit = unit
    if (category !== undefined) {
      itemUpdates.category = category || null
      const inferred = category ? inferItemType(category) : null
      if (inferred) itemUpdates.item_type = inferred
    }

    if (Object.keys(itemUpdates).length > 0) {
      const { error } = await supabase
        .from('inventory_items')
        .update(itemUpdates)
        .eq('id', id)
        .eq('business_id', businessId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (quantity_on_hand !== null && quantity_on_hand !== undefined) {
      const today = (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate))
        ? clientDate
        : new Date().toLocaleDateString('en-CA')

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
        .upsert({
          upload_id: upload.id,
          business_id: businessId,
          count_date: today,
          raw_item_name: item?.name ?? '',
          inventory_item_id: id,
          quantity_on_hand: Number(quantity_on_hand),
          unit_type: item?.unit ?? null,
        }, { onConflict: 'business_id,inventory_item_id,count_date' })
      if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) { return authErrorResponse(e) }
}
