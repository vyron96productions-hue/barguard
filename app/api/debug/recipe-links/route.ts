import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

/**
 * Temporary diagnostic endpoint — shows whether recipes and counts are linked.
 * Hit GET /api/debug/recipe-links to see the results.
 * Remove this file after diagnosing.
 */
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [
      { data: items, error: itemsErr },
      { data: counts },
      { data: menuItems },
      { data: recipes },
      { data: sales },
    ] = await Promise.all([
      supabase.from('inventory_items').select('id, name, unit').eq('business_id', businessId),
      supabase.from('inventory_counts').select('inventory_item_id, count_date').eq('business_id', businessId).order('count_date', { ascending: false }),
      supabase.from('menu_items').select('id, name').eq('business_id', businessId),
      supabase.from('menu_item_recipes').select('menu_item_id, inventory_item_id, quantity, unit'),
      supabase.from('sales_transactions').select('menu_item_id, quantity_sold, sale_date').eq('business_id', businessId).not('menu_item_id', 'is', null).order('sale_date', { ascending: false }).limit(10),
    ])

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    const inventoryIds = new Set((items ?? []).map(i => i.id))
    const menuIds = new Set((menuItems ?? []).map(m => m.id))
    const countedItemIds = new Set((counts ?? []).map(c => c.inventory_item_id))

    // Which recipes have both a valid menu_item_id and inventory_item_id for this business
    const linkedRecipes = (recipes ?? []).filter(r => menuIds.has(r.menu_item_id) && inventoryIds.has(r.inventory_item_id))
    const orphanedRecipes = (recipes ?? []).filter(r => !menuIds.has(r.menu_item_id) || !inventoryIds.has(r.inventory_item_id))

    return NextResponse.json({
      business_id: businessId,
      inventory_items: (items ?? []).length,
      inventory_items_with_counts: countedItemIds.size,
      menu_items: (menuItems ?? []).length,
      total_recipe_rows: (recipes ?? []).length,
      linked_recipes_this_business: linkedRecipes.length,
      orphaned_recipes: orphanedRecipes.length,
      recent_matched_sales: (sales ?? []).length,
      sample_recipes: linkedRecipes.slice(0, 5).map(r => ({
        menu_item: (menuItems ?? []).find(m => m.id === r.menu_item_id)?.name,
        inventory_item: (items ?? []).find(i => i.id === r.inventory_item_id)?.name,
        quantity: r.quantity,
        unit: r.unit,
      })),
      sample_sales: (sales ?? []).slice(0, 5).map(s => ({
        menu_item: (menuItems ?? []).find(m => m.id === s.menu_item_id)?.name ?? s.menu_item_id,
        qty: s.quantity_sold,
        date: s.sale_date,
      })),
    })
  } catch (e) { return authErrorResponse(e) }
}
