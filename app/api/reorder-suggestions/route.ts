import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { convertToOz, UNIT_TO_OZ } from '@/lib/conversions'
import { getUpcomingHolidays } from '@/lib/seasonal-patterns'

export interface ReorderSuggestion {
  item_id: string
  item_name: string
  unit: string
  category: string | null
  vendor_id: string | null
  vendor_name: string | null
  vendor_email: string | null
  current_stock: number | null
  avg_daily_usage: number  // units per day over last 30 days
  days_remaining: number | null  // null if no usage data
  last_order_qty: number | null
  reorder_level: number | null
  pack_size: number | null  // e.g. lbs per case for food, units per pack for beverage
  priority: 'urgent' | 'soon' | 'watch' | 'ok'
  should_reorder: boolean
  suggested_qty: number
  reasoning: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    // --- Fetch all inventory items with vendor info ---
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, name, unit, category, item_type, pack_size, package_type, reorder_level, vendor_id, vendors:vendor_id(id, name, email)')
      .eq('business_id', businessId)
      .order('name')

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
    if (!items || items.length === 0) return NextResponse.json([])

    // Only process items with a vendor OR a reorder_level
    const relevantItems = items.filter(
      (i) => i.vendor_id != null || i.reorder_level != null
    )
    if (relevantItems.length === 0) return NextResponse.json([])

    const itemIds = relevantItems.map((i) => i.id)

    // --- Get latest inventory count per item ---
    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('inventory_item_id, quantity_on_hand, count_date, unit_type')
      .eq('business_id', businessId)
      .in('inventory_item_id', itemIds)
      .order('count_date', { ascending: false })

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

    // --- Get recipes for relevant items ---
    const { data: recipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id, quantity, unit')
      .in('inventory_item_id', itemIds.length > 0 ? itemIds : ['none'])

    // Build: inventory_item_id → [{ menu_item_id, oz_per_sale }]
    const recipesByInvItem: Record<string, Array<{ menu_item_id: string; oz_per_sale: number }>> = {}
    for (const r of recipes ?? []) {
      if (!recipesByInvItem[r.inventory_item_id]) recipesByInvItem[r.inventory_item_id] = []
      recipesByInvItem[r.inventory_item_id].push({
        menu_item_id: r.menu_item_id,
        oz_per_sale: convertToOz(r.quantity, r.unit),
      })
    }

    // --- Get sales for last 30 days ---
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA')

    const allMenuItemIds = [...new Set((recipes ?? []).map((r) => r.menu_item_id))]

    const { data: salesData } = await supabase
      .from('sales_transactions')
      .select('menu_item_id, quantity_sold, sale_date')
      .eq('business_id', businessId)
      .gte('sale_date', thirtyDaysAgoStr)
      .in('menu_item_id', allMenuItemIds.length > 0 ? allMenuItemIds : ['none'])

    // Build: menu_item_id → total_sold over 30 days
    const menuItemTotalSales: Record<string, number> = {}
    for (const s of salesData ?? []) {
      if (!s.menu_item_id) continue
      menuItemTotalSales[s.menu_item_id] = (menuItemTotalSales[s.menu_item_id] ?? 0) + (s.quantity_sold ?? 0)
    }

    // --- Get last purchase per item ---
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('inventory_item_id, quantity_purchased, unit_type, purchase_date')
      .eq('business_id', businessId)
      .in('inventory_item_id', itemIds.length > 0 ? itemIds : ['none'])
      .order('purchase_date', { ascending: false })

    const lastPurchaseMap: Record<string, number> = {}
    for (const p of purchasesData ?? []) {
      if (!p.inventory_item_id || lastPurchaseMap[p.inventory_item_id] !== undefined) continue
      lastPurchaseMap[p.inventory_item_id] = p.quantity_purchased
    }

    // --- Estimate current stock using same logic as /api/stock-levels ---
    // Find earliest count date across relevant items
    const relevantCountDates = relevantItems
      .map((i) => latestCountMap.get(i.id)?.count_date)
      .filter(Boolean) as string[]
    const earliestCountDate = relevantCountDates.sort()[0] ?? null

    const purchasesAfterCountMap: Record<string, number> = {}
    if (earliestCountDate) {
      for (const p of purchasesData ?? []) {
        if (!p.inventory_item_id) continue
        const count = latestCountMap.get(p.inventory_item_id)
        if (!count || p.purchase_date <= count.count_date) continue
        const item = relevantItems.find((i) => i.id === p.inventory_item_id)
        const unit = p.unit_type ?? item?.unit ?? 'oz'
        const oz = convertToOz(p.quantity_purchased, unit)
        purchasesAfterCountMap[p.inventory_item_id] = (purchasesAfterCountMap[p.inventory_item_id] ?? 0) + oz
      }
    }

    // --- Build structured data for Claude ---
    const itemPayload = relevantItems.map((item) => {
      const count = latestCountMap.get(item.id) ?? null
      const vendor = (item.vendors as unknown as { id: string; name: string; email: string } | null)

      // Calculate avg daily usage in native units (via oz conversion)
      let avgDailyUsageOz = 0
      const recipeList = recipesByInvItem[item.id] ?? []
      for (const recipe of recipeList) {
        const totalSales = menuItemTotalSales[recipe.menu_item_id] ?? 0
        avgDailyUsageOz += (totalSales / 30) * recipe.oz_per_sale
      }

      // Convert oz/day back to native units/day
      const unitFactor = UNIT_TO_OZ[item.unit.toLowerCase().trim()] ?? null
      const avgDailyUsage = unitFactor && unitFactor > 0
        ? avgDailyUsageOz / unitFactor
        : avgDailyUsageOz  // food items: pass through as-is

      // Estimated current stock
      let currentStock: number | null = null
      if (count) {
        if (unitFactor && recipeList.length > 0) {
          const lastCountOz = convertToOz(count.quantity_on_hand, item.unit)
          const purchasedOz = purchasesAfterCountMap[item.id] ?? 0
          // Sales usage since last count
          let usedOzSinceCount = 0
          for (const recipe of recipeList) {
            for (const s of salesData ?? []) {
              if (s.menu_item_id !== recipe.menu_item_id) continue
              if (s.sale_date > count.count_date) {
                usedOzSinceCount += (s.quantity_sold ?? 0) * recipe.oz_per_sale
              }
            }
          }
          const estimatedOz = lastCountOz + purchasedOz - usedOzSinceCount
          currentStock = Math.max(0, estimatedOz / unitFactor)
        } else {
          currentStock = count.quantity_on_hand
        }
      }

      const daysRemaining = currentStock != null && avgDailyUsage > 0
        ? currentStock / avgDailyUsage
        : null

      return {
        item_id: item.id,
        item_name: item.name,
        unit: item.unit,
        category: item.category,
        vendor_id: vendor?.id ?? null,
        vendor_name: vendor?.name ?? null,
        reorder_level: item.reorder_level,
        pack_size: item.pack_size ?? null,
        current_stock: currentStock != null ? Math.round(currentStock * 10) / 10 : null,
        avg_daily_usage: Math.round(avgDailyUsage * 100) / 100,
        days_remaining: daysRemaining != null ? Math.round(daysRemaining * 10) / 10 : null,
        last_order_qty: lastPurchaseMap[item.id] ?? null,
      }
    })

    // --- Seasonal / holiday pattern detection ---
    const upcomingHolidays = getUpcomingHolidays(new Date(), 35)
    const seasonalAlerts: Array<{
      holiday: string
      days_until: number
      items: Array<{ item_name: string; surge_pct: number }>
    }> = []

    for (const holiday of upcomingHolidays) {
      // Query sales from same ±7 day window last year
      const { data: historicalSales } = await supabase
        .from('sales_transactions')
        .select('menu_item_id, quantity_sold')
        .eq('business_id', businessId)
        .gte('sale_date', holiday.lastYearStart)
        .lte('sale_date', holiday.lastYearEnd)
        .not('menu_item_id', 'is', null)

      if (!historicalSales || historicalSales.length === 0) continue

      // Aggregate last year's sales per menu_item_id
      const historicalMenuSales: Record<string, number> = {}
      for (const s of historicalSales) {
        if (!s.menu_item_id) continue
        historicalMenuSales[s.menu_item_id] = (historicalMenuSales[s.menu_item_id] ?? 0) + (s.quantity_sold ?? 0)
      }

      const windowDays = 8 // 7 days before + day of
      const surges: Array<{ item_name: string; surge_pct: number }> = []

      for (const item of itemPayload) {
        if (item.avg_daily_usage === 0) continue
        const recipeList = recipesByInvItem[item.item_id] ?? []
        if (recipeList.length === 0) continue

        let historicalDailyOz = 0
        for (const recipe of recipeList) {
          const sold = historicalMenuSales[recipe.menu_item_id] ?? 0
          historicalDailyOz += (sold / windowDays) * recipe.oz_per_sale
        }

        const unitFactor = UNIT_TO_OZ[item.unit?.toLowerCase()?.trim() ?? ''] ?? 1
        const historicalDailyNative = historicalDailyOz / unitFactor
        const surgeMultiplier = historicalDailyNative / item.avg_daily_usage

        if (surgeMultiplier > 1.25) {
          surges.push({
            item_name: item.item_name,
            surge_pct: Math.round((surgeMultiplier - 1) * 100),
          })
        }
      }

      if (surges.length > 0) {
        seasonalAlerts.push({
          holiday: holiday.name,
          days_until: holiday.daysUntil,
          items: surges.sort((a, b) => b.surge_pct - a.surge_pct).slice(0, 8),
        })
      }
    }

    const seasonalSection = seasonalAlerts.length > 0
      ? `\n\nSEASONAL ALERTS (based on last year's actual sales data for this business):
${seasonalAlerts.map((a) =>
  `- ${a.holiday} is in ${a.days_until} day${a.days_until !== 1 ? 's' : ''}. Last year these items had significantly higher usage that week:\n` +
  a.items.map((i) => `    ${i.item_name}: +${i.surge_pct}% above normal`).join('\n')
).join('\n')}

For items with seasonal surge data, increase suggested_qty to account for the spike and mention the upcoming holiday in your reasoning.`
      : ''

    // --- Call Claude for suggestions ---
    const prompt = `You are a bar inventory management assistant. Analyze the following inventory items and determine which ones need to be reordered.

For each item, determine:
- should_reorder: true if stock is low or at/below reorder level
- priority:
  - "urgent" = less than 2 days of stock remaining, or current_stock is at or below reorder_level
  - "soon" = 2-7 days of stock remaining
  - "watch" = 7-14 days of stock remaining
  - "ok" = 14+ days of stock remaining AND above reorder_level
- suggested_qty: enough stock for ~14 days based on avg_daily_usage. Round to sensible order quantities (e.g. cases of 24 for beer cans/bottles, 6 or 12 for wine, 6 for spirits). If avg_daily_usage is 0 or unknown, suggest reorder_level × 3, or last_order_qty, or a sensible default of 12.
- reasoning: a brief 1-sentence explanation

Inventory items:
${JSON.stringify(itemPayload, null, 2)}
${seasonalSection}

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "suggestions": [
    {
      "item_id": "uuid",
      "should_reorder": true,
      "priority": "urgent|soon|watch|ok",
      "suggested_qty": 144,
      "reasoning": "brief explanation"
    }
  ]
}`

    let claudeSuggestions: Array<{
      item_id: string
      should_reorder: boolean
      priority: 'urgent' | 'soon' | 'watch' | 'ok'
      suggested_qty: number
      reasoning: string
    }> = []

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const stripped = content.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        const parsed = JSON.parse(stripped)
        claudeSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      }
    } catch {
      // If Claude fails, fall back to rule-based suggestions
      claudeSuggestions = itemPayload.map((item) => {
        let priority: 'urgent' | 'soon' | 'watch' | 'ok' = 'ok'
        let should_reorder = false

        if (item.days_remaining != null) {
          if (item.days_remaining < 2) { priority = 'urgent'; should_reorder = true }
          else if (item.days_remaining < 7) { priority = 'soon'; should_reorder = true }
          else if (item.days_remaining < 14) { priority = 'watch'; should_reorder = true }
        }
        if (item.reorder_level != null && item.current_stock != null && item.current_stock <= item.reorder_level) {
          priority = 'urgent'; should_reorder = true
        }

        const suggested_qty = item.avg_daily_usage > 0
          ? Math.ceil(item.avg_daily_usage * 14)
          : item.last_order_qty ?? (item.reorder_level != null ? item.reorder_level * 3 : 12)

        return {
          item_id: item.item_id,
          should_reorder,
          priority,
          suggested_qty: Math.max(1, suggested_qty),
          reasoning: item.days_remaining != null
            ? `${item.days_remaining.toFixed(1)} days of stock remaining at current usage.`
            : 'No usage data — based on reorder level.',
        }
      })
    }

    // --- Build final response ---
    const suggestionMap = new Map(claudeSuggestions.map((s) => [s.item_id, s]))

    const results: ReorderSuggestion[] = itemPayload.map((item) => {
      const suggestion = suggestionMap.get(item.item_id)
      const rawItem = relevantItems.find((i) => i.id === item.item_id)
      const vendor = (rawItem?.vendors as unknown as { id: string; name: string; email: string } | null)

      return {
        item_id: item.item_id,
        item_name: item.item_name,
        unit: item.unit,
        category: item.category,
        vendor_id: vendor?.id ?? null,
        vendor_name: vendor?.name ?? null,
        vendor_email: vendor?.email ?? null,
        current_stock: item.current_stock,
        avg_daily_usage: item.avg_daily_usage,
        days_remaining: item.days_remaining,
        last_order_qty: item.last_order_qty,
        reorder_level: item.reorder_level,
        pack_size: item.pack_size,
        priority: suggestion?.priority ?? 'ok',
        should_reorder: suggestion?.should_reorder ?? false,
        suggested_qty: suggestion?.suggested_qty ?? 12,
        reasoning: suggestion?.reasoning ?? '',
      }
    })

    return NextResponse.json(results)
  } catch (e) { return authErrorResponse(e) }
}
