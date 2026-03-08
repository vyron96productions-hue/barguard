import { supabase, DEMO_BUSINESS_ID } from './db'

/**
 * Given a list of raw names, return those that have no alias mapping.
 */
export async function findUnmatchedInventoryNames(rawNames: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('inventory_item_aliases')
    .select('raw_name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .in('raw_name', rawNames)

  const matched = new Set((data ?? []).map((r) => r.raw_name))

  // Also check direct name matches
  const { data: directMatches } = await supabase
    .from('inventory_items')
    .select('name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .in('name', rawNames)

  const directNames = new Set((directMatches ?? []).map((r) => r.name))

  return rawNames.filter((n) => !matched.has(n) && !directNames.has(n))
}

export async function findUnmatchedMenuNames(rawNames: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('menu_item_aliases')
    .select('raw_name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .in('raw_name', rawNames)

  const matched = new Set((data ?? []).map((r) => r.raw_name))

  const { data: directMatches } = await supabase
    .from('menu_items')
    .select('name')
    .eq('business_id', DEMO_BUSINESS_ID)
    .in('name', rawNames)

  const directNames = new Set((directMatches ?? []).map((r) => r.name))

  return rawNames.filter((n) => !matched.has(n) && !directNames.has(n))
}

/**
 * Resolve a raw name to an inventory_item_id, checking aliases then direct name match.
 */
export async function resolveInventoryItemId(rawName: string): Promise<string | null> {
  // Check alias table first
  const { data: alias } = await supabase
    .from('inventory_item_aliases')
    .select('inventory_item_id')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('raw_name', rawName)
    .maybeSingle()

  if (alias) return alias.inventory_item_id

  // Try direct name match
  const { data: item } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('name', rawName)
    .maybeSingle()

  return item?.id ?? null
}

export async function resolveMenuItemId(rawName: string): Promise<string | null> {
  const { data: alias } = await supabase
    .from('menu_item_aliases')
    .select('menu_item_id')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('raw_name', rawName)
    .maybeSingle()

  if (alias) return alias.menu_item_id

  const { data: item } = await supabase
    .from('menu_items')
    .select('id')
    .eq('business_id', DEMO_BUSINESS_ID)
    .eq('name', rawName)
    .maybeSingle()

  return item?.id ?? null
}
