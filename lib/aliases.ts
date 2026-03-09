// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = { from: (table: string) => any }

export async function findUnmatchedInventoryNames(
  rawNames: string[],
  client: DbClient,
  businessId: string
): Promise<string[]> {
  const { data } = await client
    .from('inventory_item_aliases')
    .select('raw_name')
    .eq('business_id', businessId)
    .in('raw_name', rawNames)

  const matched = new Set((data ?? []).map((r: { raw_name: string }) => r.raw_name))

  const { data: directMatches } = await client
    .from('inventory_items')
    .select('name')
    .eq('business_id', businessId)
    .in('name', rawNames)

  const directNames = new Set((directMatches ?? []).map((r: { name: string }) => r.name))

  return rawNames.filter((n) => !matched.has(n) && !directNames.has(n))
}

export async function findUnmatchedMenuNames(
  rawNames: string[],
  client: DbClient,
  businessId: string
): Promise<string[]> {
  const { data } = await client
    .from('menu_item_aliases')
    .select('raw_name')
    .eq('business_id', businessId)
    .in('raw_name', rawNames)

  const matched = new Set((data ?? []).map((r: { raw_name: string }) => r.raw_name))

  const { data: directMatches } = await client
    .from('menu_items')
    .select('name')
    .eq('business_id', businessId)
    .in('name', rawNames)

  const directNames = new Set((directMatches ?? []).map((r: { name: string }) => r.name))

  return rawNames.filter((n) => !matched.has(n) && !directNames.has(n))
}

export async function resolveInventoryItemId(
  rawName: string,
  client: DbClient,
  businessId: string
): Promise<string | null> {
  const { data: alias } = await client
    .from('inventory_item_aliases')
    .select('inventory_item_id')
    .eq('business_id', businessId)
    .eq('raw_name', rawName)
    .maybeSingle()

  if (alias) return alias.inventory_item_id

  const { data: item } = await client
    .from('inventory_items')
    .select('id')
    .eq('business_id', businessId)
    .eq('name', rawName)
    .maybeSingle()

  return item?.id ?? null
}

export async function resolveMenuItemId(
  rawName: string,
  client: DbClient,
  businessId: string
): Promise<string | null> {
  const { data: alias } = await client
    .from('menu_item_aliases')
    .select('menu_item_id')
    .eq('business_id', businessId)
    .eq('raw_name', rawName)
    .maybeSingle()

  if (alias) return alias.menu_item_id

  const { data: item } = await client
    .from('menu_items')
    .select('id')
    .eq('business_id', businessId)
    .eq('name', rawName)
    .maybeSingle()

  return item?.id ?? null
}
