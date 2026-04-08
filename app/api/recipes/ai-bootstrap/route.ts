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

    const menuList = menuItems
      .map((m) => `${m.id}|${m.name}|${m.item_type ?? 'drink'}`)
      .join('\n')

    const prompt = `You are a bar management assistant. Given these menu items sold at a bar, identify the primary ingredients (inventory items) a bar would stock to make them, and a standard recipe pour quantity for each.

Rules:
- Each ingredient you list will become an inventory item — name it as a bar would stock it (e.g. "Tequila", "Vodka", "Rum", "Bud Light", "House Red Wine")
- Do NOT be brand-specific unless the menu item name is brand-specific (e.g. "Jack Daniel's" menu item → ingredient "Jack Daniel's")
- Beer/cider by name: ingredient = same name, unit = "each", qty = 1
  - EXCEPTION: if item_type is "beer" and name implies draft (Draft, Tap, Pint), use unit = "pint", qty = 1
- Spirits/cocktails: use the PRIMARY spirit only (1 ingredient per drink is fine), unit = "oz", typical pour qty
  - Margarita → Tequila, 1.5 oz
  - Moscow Mule → Vodka, 1.5 oz
  - Old Fashioned → Whiskey, 2 oz
  - Gin & Tonic → Gin, 1.5 oz
  - Dark & Stormy → Rum, 1.5 oz
  - Lemon Drop → Vodka, 1 oz
  - Aperol Spritz → Aperol, 2 oz
  - Negroni → Gin, 1 oz
  - Whiskey Sour → Whiskey, 2 oz
  - Paloma → Tequila, 2 oz
  - Long Island Iced Tea → Vodka, 0.5 oz
  - Mimosa → Champagne, 4 oz
  - Wine by glass → same wine name, unit = "oz", qty = 5
- Food items: ingredient = the main protein/component, unit = "portion", qty = 1, item_type = "food"
- Shots of a specific spirit: ingredient = that spirit name, unit = "oz", qty = 1.5
- If a menu item is already an ingredient (e.g. "Tequila Shot") → ingredient = "Tequila", 1.5 oz
- Skip modifiers, sodas, juices as ingredients
- Deduplicate ingredients — if multiple drinks use Vodka, list Vodka once

Return ONLY valid JSON, no markdown, no explanation:
{
  "ingredients": [
    {"name": "Tequila", "unit": "oz", "item_type": "beverage"},
    ...
  ],
  "recipes": [
    {"menu_item_id": "<exact id from input>", "ingredient_name": "Tequila", "quantity": 1.5, "unit": "oz"},
    ...
  ]
}

Menu items (id|name|type):
${menuList}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      ingredients: Array<{ name: string; unit: string; item_type: string }>
      recipes: Array<{ menu_item_id: string; ingredient_name: string; quantity: number; unit: string }>
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]))

    const ingredients: BootstrapIngredient[] = (parsed.ingredients ?? [])
      .filter((i) => i.name && i.unit)
      .map((i) => ({
        name: i.name.trim(),
        unit: i.unit.trim(),
        item_type: i.item_type === 'food' ? 'food' : 'beverage',
      }))

    const recipes: BootstrapRecipeLine[] = (parsed.recipes ?? [])
      .filter((r) => menuMap.has(r.menu_item_id) && r.ingredient_name && r.quantity > 0)
      .map((r) => ({
        menu_item_id: r.menu_item_id,
        menu_item_name: menuMap.get(r.menu_item_id)!.name,
        ingredient_name: r.ingredient_name.trim(),
        quantity: r.quantity,
        unit: r.unit ?? 'oz',
      }))

    return NextResponse.json({ ingredients, recipes } satisfies BootstrapResult)
  } catch (e) {
    return authErrorResponse(e)
  }
}
