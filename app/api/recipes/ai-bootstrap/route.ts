import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface BootstrapIngredient {
  name: string
  unit: string          // oz | each | pint | portion | lb | case
  item_type: 'beverage' | 'food'
}

export interface BootstrapRecipeLine {
  menu_item_id: string
  menu_item_name: string
  ingredient_name: string  // matches BootstrapIngredient.name
  quantity: number
  unit: string
}

export interface BootstrapResult {
  ingredients: BootstrapIngredient[]
  recipes: BootstrapRecipeLine[]
}

// POST /api/recipes/ai-bootstrap
// Used when a business has menu items but zero inventory items.
// Claude infers standard bar ingredients from the menu item names,
// returns the ingredients to create + the recipe lines to link them.
export async function POST() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, item_type')
      .eq('business_id', businessId)

    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json({ ingredients: [], recipes: [] })
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]))

    const SYSTEM = `You are a bar management assistant. Given menu items sold at a bar, identify the primary ingredient (inventory item) a bar stocks to make each one, and the standard pour quantity.

Rules:
- Name ingredients as a bar stocks them (e.g. "Tequila", "Vodka", "Bud Light")
- Only brand-specific if the menu item name is brand-specific
- Beer/cider: ingredient = same name, unit = "each", qty = 1. Draft/Tap/Pint → unit = "pint"
- Spirits/cocktails: PRIMARY spirit only, unit = "oz". Typical pours: most cocktails 1.5oz, Old Fashioned 2oz, wine glass 5oz
- Food: main component, unit = "portion", qty = 1, item_type = "food"
- Skip items that are pure modifiers, sodas, or non-trackable
- Deduplicate ingredients across the batch — list each unique ingredient once in "ingredients"

Return ONLY valid JSON:
{"ingredients":[{"name":"Tequila","unit":"oz","item_type":"beverage"}],"recipes":[{"menu_item_id":"<id>","ingredient_name":"Tequila","quantity":1.5,"unit":"oz"}]}`

    // Batch into groups of 40 to stay well under token limits
    const BATCH_SIZE = 40
    const allIngredients: BootstrapIngredient[] = []
    const allRecipes: BootstrapRecipeLine[] = []
    const seenIngredients = new Set<string>()

    for (let i = 0; i < menuItems.length; i += BATCH_SIZE) {
      const batch = menuItems.slice(i, i + BATCH_SIZE)
      const menuList = batch.map((m) => `${m.id}|${m.name}|${m.item_type ?? 'drink'}`).join('\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Menu items (id|name|type):\n${menuList}` }],
      })

      const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue  // skip malformed batch, keep going

      let parsed: {
        ingredients: Array<{ name: string; unit: string; item_type: string }>
        recipes: Array<{ menu_item_id: string; ingredient_name: string; quantity: number; unit: string }>
      }
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        continue  // skip malformed batch
      }

      for (const ing of parsed.ingredients ?? []) {
        if (!ing.name) continue
        const key = ing.name.trim().toLowerCase()
        if (!seenIngredients.has(key)) {
          seenIngredients.add(key)
          allIngredients.push({
            name: ing.name.trim(),
            unit: ing.unit?.trim() ?? 'oz',
            item_type: ing.item_type === 'food' ? 'food' : 'beverage',
          })
        }
      }

      for (const r of parsed.recipes ?? []) {
        if (!menuMap.has(r.menu_item_id) || !r.ingredient_name || !(r.quantity > 0)) continue
        allRecipes.push({
          menu_item_id: r.menu_item_id,
          menu_item_name: menuMap.get(r.menu_item_id)!.name,
          ingredient_name: r.ingredient_name.trim(),
          quantity: r.quantity,
          unit: r.unit ?? 'oz',
        })
      }
    }

    if (allIngredients.length === 0) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    return NextResponse.json({ ingredients: allIngredients, recipes: allRecipes } satisfies BootstrapResult)
  } catch (e) {
    return authErrorResponse(e)
  }
}
