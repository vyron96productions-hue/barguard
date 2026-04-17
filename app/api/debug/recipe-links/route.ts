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
      supabase.from('menu_items').select('id, name, item_type').eq('business_id', businessId),
      supabase.from('menu_item_recipes').select('menu_item_id, inventory_item_id, quantity, unit'),
      supabase.from('sales_transactions').select('menu_item_id, quantity_sold, sale_date').eq('business_id', businessId).not('menu_item_id', 'is', null).order('sale_date', { ascending: false }).limit(20),
    ])

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    const inventoryIds = new Set((items ?? []).map(i => i.id))
    const menuIds = new Set((menuItems ?? []).map(m => m.id))

    // Latest count per inventory item
    const latestCountDate: Record<string, string> = {}
    for (const c of counts ?? []) {
      if (!latestCountDate[c.inventory_item_id]) {
        latestCountDate[c.inventory_item_id] = c.count_date
      }
    }

    const countedItemIds = new Set(Object.keys(latestCountDate))

    // Which recipes have both a valid menu_item_id and inventory_item_id for this business
    const linkedRecipes = (recipes ?? []).filter(r => menuIds.has(r.menu_item_id) && inventoryIds.has(r.inventory_item_id))
    const orphanedRecipes = (recipes ?? []).filter(r => !menuIds.has(r.menu_item_id) || !inventoryIds.has(r.inventory_item_id))

    // Inventory items with BOTH a count AND a recipe (these will get estimates)
    const invItemsWithRecipe = new Set(linkedRecipes.map(r => r.inventory_item_id))
    const invItemsWithCountAndRecipe = (items ?? []).filter(i => countedItemIds.has(i.id) && invItemsWithRecipe.has(i.id))
    const invItemsWithCountNoRecipe = (items ?? []).filter(i => countedItemIds.has(i.id) && !invItemsWithRecipe.has(i.id))
    const invItemsNoCount = (items ?? []).filter(i => !countedItemIds.has(i.id))

    // Menu items with recipes vs without
    const menuItemsWithRecipe = new Set(linkedRecipes.map(r => r.menu_item_id))
    const menuItemsNoRecipe = (menuItems ?? []).filter(m => !menuItemsWithRecipe.has(m.id))

    // Sales with menu items that have NO recipe
    const recentSalesNoRecipe = (sales ?? []).filter(s => s.menu_item_id && !menuItemsWithRecipe.has(s.menu_item_id))

    return NextResponse.json({
      business_id: businessId,
      summary: {
        inventory_items: (items ?? []).length,
        inventory_items_with_counts: countedItemIds.size,
        inventory_items_with_count_and_recipe: invItemsWithCountAndRecipe.length,
        inventory_items_with_count_but_no_recipe: invItemsWithCountNoRecipe.length,
        inventory_items_no_count: invItemsNoCount.length,
        menu_items: (menuItems ?? []).length,
        menu_items_with_recipes: menuItemsWithRecipe.size,
        menu_items_without_recipes: menuItemsNoRecipe.length,
        total_recipe_rows: (recipes ?? []).length,
        linked_recipes: linkedRecipes.length,
        orphaned_recipes: orphanedRecipes.length,
        recent_matched_sales: (sales ?? []).length,
      },
      will_deduct_stock: invItemsWithCountAndRecipe.map(i => ({ name: i.name, count_date: latestCountDate[i.id] })),
      counted_but_no_recipe: invItemsWithCountNoRecipe.slice(0, 10).map(i => ({ name: i.name })),
      menu_items_without_recipes: menuItemsNoRecipe.slice(0, 20).map(m => ({ name: m.name, type: m.item_type })),
      recent_sales_linked_but_no_recipe: recentSalesNoRecipe.slice(0, 10).map(s => ({
        menu_item: (menuItems ?? []).find(m => m.id === s.menu_item_id)?.name ?? s.menu_item_id,
        qty: s.quantity_sold,
        date: s.sale_date,
      })),
      sample_working_recipes: linkedRecipes.slice(0, 5).map(r => ({
        menu_item: (menuItems ?? []).find(m => m.id === r.menu_item_id)?.name,
        inventory_item: (items ?? []).find(i => i.id === r.inventory_item_id)?.name,
        quantity: r.quantity,
        unit: r.unit,
      })),
    })
  } catch (e) { return authErrorResponse(e) }
}
