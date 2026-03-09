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
    }))

    const { error } = await adminSupabase.from('sales_transactions').insert(batch)
    if (error) throw new Error(`Failed to insert transactions: ${error.message}`)
    totalInserted += batch.length
  }

  return totalInserted
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
