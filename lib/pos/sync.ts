import { adminSupabase } from '@/lib/supabase/admin'
import type { NormalizedSaleItem, PosProvider } from './types'
import { logger } from '@/lib/logger'

/**
 * Saves normalized POS sale items into sales_uploads + sales_transactions,
 * matching the same shape as a manual CSV upload.
 * Returns number of transactions inserted.
 */
export async function importPosItemsToSupabase(
  provider: PosProvider,
  periodStart: string,
  periodEnd: string,
  items: NormalizedSaleItem[],
  businessId: string
): Promise<number> {
  if (items.length === 0) return 0

  // ── Idempotency: delete existing transactions for this date range + provider ──
  // Only fetch uploads that overlap this period (not all historical ones) to
  // avoid building a huge .in() clause that exceeds the PostgREST URL limit
  // and silently fails, causing transactions to stack on every re-sync.
  const { data: existingUploads } = await adminSupabase
    .from('sales_uploads')
    .select('id')
    .eq('business_id', businessId)
    .eq('pos_type', provider)
    .lte('period_start', periodEnd)
    .gte('period_end', periodStart)

  if (existingUploads?.length) {
    const uploadIds = existingUploads.map((u: { id: string }) => u.id)

    // Delete transactions in batches to stay under the PostgREST URL limit
    const CHUNK = 50
    for (let c = 0; c < uploadIds.length; c += CHUNK) {
      await adminSupabase
        .from('sales_transactions')
        .delete()
        .eq('business_id', businessId)
        .gte('sale_date', periodStart)
        .lte('sale_date', periodEnd)
        .in('upload_id', uploadIds.slice(c, c + CHUNK))
    }

    // Also delete the stale upload records themselves so they don't accumulate
    // (each re-sync creates a new upload; without cleanup they build up over time)
    for (let c = 0; c < uploadIds.length; c += CHUNK) {
      await adminSupabase
        .from('sales_uploads')
        .delete()
        .in('id', uploadIds.slice(c, c + CHUNK))
    }
  }

  const { data: upload, error: uploadErr } = await adminSupabase
    .from('sales_uploads')
    .insert({
      business_id: businessId,
      filename: `${provider}_sync_${periodStart}_${periodEnd}`,
      period_start: periodStart,
      period_end: periodEnd,
      row_count: items.length,
      pos_type: provider,
    })
    .select()
    .single()

  if (uploadErr || !upload) throw new Error(`Failed to create upload record: ${uploadErr?.message}`)

  const { data: aliases } = await adminSupabase
    .from('menu_item_aliases')
    .select('raw_name, menu_item_id')
    .eq('business_id', businessId)

  const aliasMap = new Map<string, string>()
  for (const a of aliases ?? []) {
    aliasMap.set(a.raw_name.toLowerCase().trim(), a.menu_item_id)
  }

  const { data: menuItems } = await adminSupabase
    .from('menu_items')
    .select('id, name')
    .eq('business_id', businessId)

  const menuMap = new Map<string, string>()
  for (const m of menuItems ?? []) {
    menuMap.set(m.name.toLowerCase().trim(), m.id)
  }

  function resolveMenuItemId(rawName: string): string | null {
    const key = rawName.toLowerCase().trim()
    return aliasMap.get(key) ?? menuMap.get(key) ?? null
  }

  const BATCH = 200
  let totalInserted = 0
  let resolvedCount = 0
  let unresolvedCount = 0

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map((item) => {
      const menuItemId = resolveMenuItemId(item.raw_item_name)
      if (menuItemId) resolvedCount++; else unresolvedCount++
      return {
        upload_id: upload.id,
        business_id: businessId,
        sale_date: item.sale_date,
        sale_timestamp: item.sale_timestamp ?? null,
        raw_item_name: item.raw_item_name,
        menu_item_id: menuItemId,
        quantity_sold: item.quantity_sold,
        gross_sales: item.gross_sales,
        station: item.station ?? null,
        modifiers: item.modifiers ?? null,
      }
    })

    const { error } = await adminSupabase.from('sales_transactions').insert(batch)
    if (error) throw new Error(`Failed to insert transactions: ${error.message}`)
    totalInserted += batch.length
  }

  logger.info('pos/sync', 'menu_item_id resolution', {
    businessId, provider, total: totalInserted,
    resolved: resolvedCount, unresolved: unresolvedCount,
    unresolvedNames: unresolvedCount > 0
      ? items.filter((i) => !resolveMenuItemId(i.raw_item_name)).map((i) => i.raw_item_name).slice(0, 20)
      : [],
  })

  return totalInserted
}

// ── Item type classifier ─────────────────────────────────────────────────────
const FOOD_WORDS = [
  'burger', 'sandwich', 'wrap', 'salad', 'soup', 'fries', 'chips', 'wings',
  'nachos', 'quesadilla', 'pizza', 'pretzel', 'taco', 'slider', 'flatbread',
  'appetizer', 'entree', 'plate', 'side', 'dessert', 'cake', 'cookie',
  'brownie', 'chicken', 'beef', 'fish', 'shrimp', 'pork', 'bacon', 'bread',
  'food', 'kitchen', 'meal', 'snack', 'basket', 'bowl', 'hot dog', 'dog',
]
const BEER_WORDS = [
  'beer', ' ale', 'lager', 'ipa', 'stout', 'porter', 'pilsner', 'hefeweizen',
  'draft', 'pint', 'brew', 'cider', 'seltzer', 'shandy',
]

function guessMenuItemType(name: string): 'drink' | 'food' | 'beer' | 'other' {
  const n = name.toLowerCase()
  if (FOOD_WORDS.some((w) => n.includes(w))) return 'food'
  if (BEER_WORDS.some((w) => n.includes(w))) return 'beer'
  return 'drink'
}

/**
 * For new accounts: auto-creates menu_items AND inventory_items from synced
 * sale names that don't already exist. Derives sell_price for menu items from
 * the sales data. Also creates menu_item_aliases and back-fills menu_item_id
 * on the transactions we just inserted.
 * Only called from the POS sync routes — never from manual upload flows.
 */
export async function autoCreateMenuItemsFromSales(
  items: NormalizedSaleItem[],
  businessId: string
): Promise<number> {
  if (items.length === 0) return 0

  // Collect unique raw names + average unit price from the synced items
  const priceMap = new Map<string, { total: number; count: number }>()
  for (const item of items) {
    const key = item.raw_item_name.trim()
    if (!key) continue
    const entry = priceMap.get(key) ?? { total: 0, count: 0 }
    if (item.gross_sales != null && item.quantity_sold > 0) {
      entry.total += item.gross_sales / item.quantity_sold
      entry.count += 1
    }
    priceMap.set(key, entry)
  }

  // Fetch existing menu items and aliases so we don't duplicate
  const [{ data: existingMenuItems }, { data: existingMenuAliases }] = await Promise.all([
    adminSupabase.from('menu_items').select('name').eq('business_id', businessId),
    adminSupabase.from('menu_item_aliases').select('raw_name').eq('business_id', businessId),
  ])

  const existingMenuNames = new Set((existingMenuItems ?? []).map((i) => i.name.toLowerCase().trim()))
  const existingMenuAliasNames = new Set((existingMenuAliases ?? []).map((a) => a.raw_name.toLowerCase().trim()))

  const allNames = [...priceMap.entries()]

  // ── Menu items ───────────────────────────────────────────────
  const menuToCreate = allNames
    .filter(([name]) => {
      const key = name.toLowerCase()
      return !existingMenuNames.has(key) && !existingMenuAliasNames.has(key)
    })
    .map(([name, { total, count }]) => ({
      business_id: businessId,
      name,
      sell_price: count > 0 ? Math.round((total / count) * 100) / 100 : null,
      item_type: guessMenuItemType(name),
    }))

  const { data: insertedMenu } = menuToCreate.length > 0
    ? await adminSupabase.from('menu_items').insert(menuToCreate).select('id, name')
    : { data: [] }

  if (insertedMenu && insertedMenu.length > 0) {
    await adminSupabase.from('menu_item_aliases').insert(
      insertedMenu.map((m) => ({ business_id: businessId, raw_name: m.name, menu_item_id: m.id }))
    )
    await Promise.all(insertedMenu.map((m) =>
      adminSupabase
        .from('sales_transactions')
        .update({ menu_item_id: m.id })
        .eq('business_id', businessId)
        .eq('raw_item_name', m.name)
        .is('menu_item_id', null)
    ))
  }

  // NOTE: We intentionally do NOT create inventory_items from sales data.
  // Inventory items are raw ingredients/stock (Tequila, Bud Light case, etc.)
  // and should come from purchase invoice imports — not from what was sold.

  return (insertedMenu?.length ?? 0)
}

export async function logPosSync(
  provider: PosProvider,
  periodStart: string,
  periodEnd: string,
  status: 'success' | 'error',
  transactionsImported: number,
  businessId: string,
  errorMessage?: string
) {
  await adminSupabase.from('pos_sync_logs').insert({
    business_id: businessId,
    pos_type: provider,
    period_start: periodStart,
    period_end: periodEnd,
    transactions_imported: transactionsImported,
    status,
    error_message: errorMessage ?? null,
  })

  if (status === 'success') {
    await adminSupabase
      .from('pos_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('pos_type', provider)
  }
}
