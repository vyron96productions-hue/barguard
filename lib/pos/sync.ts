import { adminSupabase } from '@/lib/supabase/admin'
import type { NormalizedSaleItem, PosProvider } from './types'

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

  const { data: upload, error: uploadErr } = await adminSupabase
    .from('sales_uploads')
    .insert({
      business_id: businessId,
      filename: `${provider}_sync_${periodStart}_${periodEnd}`,
      period_start: periodStart,
      period_end: periodEnd,
      row_count: items.length,
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

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map((item) => ({
      upload_id: upload.id,
      business_id: businessId,
      sale_date: item.sale_date,
      raw_item_name: item.raw_item_name,
      menu_item_id: resolveMenuItemId(item.raw_item_name),
      quantity_sold: item.quantity_sold,
      gross_sales: item.gross_sales,
      station: item.station ?? null,
      modifiers: item.modifiers ?? null,
    }))

    const { error } = await adminSupabase.from('sales_transactions').insert(batch)
    if (error) throw new Error(`Failed to insert transactions: ${error.message}`)
    totalInserted += batch.length
  }

  return totalInserted
}

/**
 * For new accounts: auto-creates menu_items from synced sale names that don't
 * already exist as a menu item or alias. Derives sell_price from the sales data.
 * Also creates menu_item_aliases and back-fills menu_item_id on the transactions
 * we just inserted.
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
  const [{ data: existingItems }, { data: existingAliases }] = await Promise.all([
    adminSupabase.from('menu_items').select('name').eq('business_id', businessId),
    adminSupabase.from('menu_item_aliases').select('raw_name').eq('business_id', businessId),
  ])

  const existingNames = new Set((existingItems ?? []).map((i) => i.name.toLowerCase().trim()))
  const existingAliasNames = new Set(
    (existingAliases ?? []).map((a) => a.raw_name.toLowerCase().trim())
  )

  const toCreate = [...priceMap.entries()]
    .filter(([name]) => {
      const key = name.toLowerCase()
      return !existingNames.has(key) && !existingAliasNames.has(key)
    })
    .map(([name, { total, count }]) => ({
      business_id: businessId,
      name,
      sell_price: count > 0 ? Math.round((total / count) * 100) / 100 : null,
      item_type: 'drink' as const,
    }))

  if (toCreate.length === 0) return 0

  const { data: inserted, error } = await adminSupabase
    .from('menu_items')
    .insert(toCreate)
    .select('id, name')

  if (error || !inserted || inserted.length === 0) return 0

  // Create aliases (raw_name = menu item name) so future syncs auto-resolve
  await adminSupabase.from('menu_item_aliases').insert(
    inserted.map((m) => ({
      business_id: businessId,
      raw_name: m.name,
      menu_item_id: m.id,
    }))
  )

  // Back-fill menu_item_id on the sales_transactions we just inserted
  for (const m of inserted) {
    await adminSupabase
      .from('sales_transactions')
      .update({ menu_item_id: m.id })
      .eq('business_id', businessId)
      .eq('raw_item_name', m.name)
      .is('menu_item_id', null)
  }

  return inserted.length
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
