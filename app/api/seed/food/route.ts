import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

/**
 * POST /api/seed/food
 * Seeds demo food inventory items, menu items, and recipes for the authenticated business.
 * Safe to call multiple times — skips items that already exist by name.
 */
export async function POST() {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')
    const { supabase, businessId } = ctx

    // ── 1. Food inventory items ──────────────────────────────────────────────
    const foodInventory = [
      { name: 'Burger Patty (4oz)',  unit: 'each',   category: 'proteins',           cost_per_unit: 2.50 },
      { name: 'Brioche Bun',         unit: 'each',   category: 'bread & starches',   cost_per_unit: 0.65 },
      { name: 'Chicken Wings',       unit: 'each',   category: 'proteins',           cost_per_unit: 0.55 },
      { name: 'Chicken Breast',      unit: 'each',   category: 'proteins',           cost_per_unit: 3.25 },
      { name: 'French Fries',        unit: 'portion',category: 'bread & starches',   cost_per_unit: 0.90 },
      { name: 'American Cheese',     unit: 'slice',  category: 'dairy',              cost_per_unit: 0.20 },
      { name: 'Lettuce',             unit: 'portion',category: 'produce',            cost_per_unit: 0.15 },
      { name: 'Tomato',              unit: 'slice',  category: 'produce',            cost_per_unit: 0.10 },
      { name: 'Onion',               unit: 'portion',category: 'produce',            cost_per_unit: 0.10 },
      { name: 'Pickles',             unit: 'portion',category: 'produce',            cost_per_unit: 0.08 },
      { name: 'House Sauce',         unit: 'portion',category: 'sauces',             cost_per_unit: 0.15 },
      { name: 'Buffalo Sauce',       unit: 'portion',category: 'sauces',             cost_per_unit: 0.20 },
      { name: 'Ranch Dressing',      unit: 'portion',category: 'sauces',             cost_per_unit: 0.18 },
      { name: 'Celery & Carrot',     unit: 'portion',category: 'produce',            cost_per_unit: 0.25 },
      { name: 'Sandwich Roll',       unit: 'each',   category: 'bread & starches',   cost_per_unit: 0.55 },
    ]

    const { data: existingItems } = await supabase
      .from('inventory_items')
      .select('name')
      .eq('business_id', businessId)

    const existingNames = new Set((existingItems ?? []).map((i: { name: string }) => i.name))
    const newInventory = foodInventory.filter((i) => !existingNames.has(i.name))

    let insertedItems: Array<{ id: string; name: string }> = []
    if (newInventory.length > 0) {
      const { data } = await supabase
        .from('inventory_items')
        .insert(newInventory.map((i) => ({ ...i, business_id: businessId, item_type: 'food' })))
        .select('id, name')
      insertedItems = data ?? []
    }

    // Build a lookup of all food inventory items (new + existing food items)
    const { data: allFoodItems } = await supabase
      .from('inventory_items')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('item_type', 'food')

    const invByName: Record<string, string> = {}
    for (const i of allFoodItems ?? []) invByName[i.name] = i.id

    // ── 2. Food menu items ───────────────────────────────────────────────────
    const foodMenuItems = [
      { name: 'Cheeseburger',        category: 'entree',     sell_price: 14.00 },
      { name: 'Double Cheeseburger', category: 'entree',     sell_price: 17.00 },
      { name: '10-Piece Wings',      category: 'appetizer',  sell_price: 16.00 },
      { name: '6-Piece Wings',       category: 'appetizer',  sell_price: 11.00 },
      { name: 'Fries',               category: 'side',       sell_price: 5.00  },
      { name: 'Chicken Sandwich',    category: 'entree',     sell_price: 13.00 },
    ]

    const { data: existingMenuItems } = await supabase
      .from('menu_items')
      .select('name')
      .eq('business_id', businessId)

    const existingMenuNames = new Set((existingMenuItems ?? []).map((i: { name: string }) => i.name))
    const newMenuItems = foodMenuItems.filter((i) => !existingMenuNames.has(i.name))

    let insertedMenuItems: Array<{ id: string; name: string }> = []
    if (newMenuItems.length > 0) {
      const { data } = await supabase
        .from('menu_items')
        .insert(newMenuItems.map((i) => ({ ...i, business_id: businessId, item_type: 'food' })))
        .select('id, name')
      insertedMenuItems = data ?? []
    }

    const { data: allFoodMenuItems } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('item_type', 'food')

    const menuByName: Record<string, string> = {}
    for (const i of allFoodMenuItems ?? []) menuByName[i.name] = i.id

    // ── 3. Recipes ───────────────────────────────────────────────────────────
    const recipes: Array<{ menu_item_id: string; inventory_item_id: string; quantity: number; unit: string }> = []

    function addRecipe(menuName: string, ingredientName: string, qty: number, unit: string) {
      const menuId = menuByName[menuName]
      const invId  = invByName[ingredientName]
      if (menuId && invId) recipes.push({ menu_item_id: menuId, inventory_item_id: invId, quantity: qty, unit })
    }

    // Cheeseburger
    addRecipe('Cheeseburger', 'Burger Patty (4oz)',  1, 'each')
    addRecipe('Cheeseburger', 'Brioche Bun',          1, 'each')
    addRecipe('Cheeseburger', 'American Cheese',      2, 'slice')
    addRecipe('Cheeseburger', 'Lettuce',              1, 'portion')
    addRecipe('Cheeseburger', 'Tomato',               2, 'slice')
    addRecipe('Cheeseburger', 'Pickles',              1, 'portion')
    addRecipe('Cheeseburger', 'House Sauce',          1, 'portion')

    // Double Cheeseburger
    addRecipe('Double Cheeseburger', 'Burger Patty (4oz)',  2, 'each')
    addRecipe('Double Cheeseburger', 'Brioche Bun',          1, 'each')
    addRecipe('Double Cheeseburger', 'American Cheese',      3, 'slice')
    addRecipe('Double Cheeseburger', 'Lettuce',              1, 'portion')
    addRecipe('Double Cheeseburger', 'Tomato',               2, 'slice')
    addRecipe('Double Cheeseburger', 'Pickles',              1, 'portion')
    addRecipe('Double Cheeseburger', 'House Sauce',          1, 'portion')

    // 10-Piece Wings
    addRecipe('10-Piece Wings', 'Chicken Wings',  10, 'each')
    addRecipe('10-Piece Wings', 'Buffalo Sauce',   1, 'portion')
    addRecipe('10-Piece Wings', 'Ranch Dressing',  1, 'portion')
    addRecipe('10-Piece Wings', 'Celery & Carrot', 1, 'portion')

    // 6-Piece Wings
    addRecipe('6-Piece Wings', 'Chicken Wings',  6, 'each')
    addRecipe('6-Piece Wings', 'Buffalo Sauce',  1, 'portion')
    addRecipe('6-Piece Wings', 'Ranch Dressing', 1, 'portion')

    // Fries
    addRecipe('Fries', 'French Fries', 1, 'portion')

    // Chicken Sandwich
    addRecipe('Chicken Sandwich', 'Chicken Breast', 1, 'each')
    addRecipe('Chicken Sandwich', 'Sandwich Roll',  1, 'each')
    addRecipe('Chicken Sandwich', 'Lettuce',        1, 'portion')
    addRecipe('Chicken Sandwich', 'Tomato',         2, 'slice')
    addRecipe('Chicken Sandwich', 'House Sauce',    1, 'portion')

    // Only insert recipes that don't already exist
    const { data: existingRecipes } = await supabase
      .from('menu_item_recipes')
      .select('menu_item_id, inventory_item_id')
      .in('menu_item_id', Object.values(menuByName))

    const existingRecipeKeys = new Set(
      (existingRecipes ?? []).map((r: { menu_item_id: string; inventory_item_id: string }) =>
        `${r.menu_item_id}:${r.inventory_item_id}`
      )
    )

    const newRecipes = recipes.filter(
      (r) => !existingRecipeKeys.has(`${r.menu_item_id}:${r.inventory_item_id}`)
    )

    if (newRecipes.length > 0) {
      await supabase.from('menu_item_recipes').insert(newRecipes)
    }

    return NextResponse.json({
      success: true,
      inventory_items_added: insertedItems.length,
      menu_items_added: insertedMenuItems.length,
      recipes_added: newRecipes.length,
    })
  } catch (e) { return authErrorResponse(e) }
}
