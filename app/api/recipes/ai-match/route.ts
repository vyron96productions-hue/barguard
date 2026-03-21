import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import type { RecipeSuggestion } from '@/lib/recipe-suggestions'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GET /api/recipes/ai-match
// Uses Claude to match existing menu items (no recipes) to inventory items
// Handles cocktails where word-matching fails (Negroni → Gin, Aperol Spritz → Aperol, etc.)
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [{ data: menuItems }, { data: inventoryItems }, { data: existingRecipes }] = await Promise.all([
      supabase.from('menu_items').select('id, name, item_type').eq('business_id', businessId),
      supabase.from('inventory_items').select('id, name, unit, item_type').eq('business_id', businessId),
      supabase.from('menu_item_recipes').select('menu_item_id').eq('business_id', businessId),
    ])

    const existingIds = new Set((existingRecipes ?? []).map((r) => r.menu_item_id))
    const unrecipied = (menuItems ?? []).filter((m) => !existingIds.has(m.id))

    if (unrecipied.length === 0 || (inventoryItems ?? []).length === 0) {
      return NextResponse.json([])
    }

    const menuList = unrecipied
      .map((m) => `${m.id}|${m.name}|${m.item_type ?? 'drink'}`)
      .join('\n')

    const invList = (inventoryItems ?? [])
      .map((i) => `${i.id}|${i.name}|${i.unit}|${i.item_type ?? 'beverage'}`)
      .join('\n')

    const prompt = `You are a bar management assistant. Match each menu item to the ONE best inventory item that is its primary ingredient.

Use your knowledge of cocktail recipes. Examples:
- Negroni → Gin (primary spirit)
- Aperol Spritz → Aperol
- Moscow Mule → Vodka
- Margarita → Tequila
- Old Fashioned → Whiskey
- Dark & Stormy → Rum
- Paloma → Tequila
- Lemon Drop → Vodka
- Espresso Martini → Vodka
- Whiskey Sour → Whiskey
- Gin & Tonic → Gin
- Rum & Coke → Rum

Rules:
- Match food menu items only to food inventory items
- Match drink menu items only to beverage inventory items
- If no inventory item fits, skip that menu item (do not include it)
- For beer by name, match to the same beer in inventory
- Use the quantity and unit that a bar would typically pour for that item
- Default pour: spirits = 1.5 oz, wine glass = 5 oz, pint = 1 pint, beer can/bottle = 1 each

Return ONLY a JSON array with no markdown:
[{"menu_item_id":"<id>","inventory_item_id":"<id>","quantity":<number>,"unit":"<unit>"}]

Menu items needing recipes (id|name|type):
${menuList}

Available inventory items (id|name|unit|type):
${invList}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json([])

    const raw = JSON.parse(jsonMatch[0]) as Array<{
      menu_item_id: string
      inventory_item_id: string
      quantity: number
      unit: string
    }>

    const menuMap = new Map(unrecipied.map((m) => [m.id, m]))
    const invMap = new Map((inventoryItems ?? []).map((i) => [i.id, i]))

    const suggestions: (RecipeSuggestion & { ai_suggested: true })[] = raw
      .filter((r) => menuMap.has(r.menu_item_id) && invMap.has(r.inventory_item_id))
      .map((r) => {
        const mi = menuMap.get(r.menu_item_id)!
        const inv = invMap.get(r.inventory_item_id)!
        return {
          menu_item_id: mi.id,
          menu_item_name: mi.name,
          inventory_item_id: inv.id,
          inventory_item_name: inv.name,
          inventory_item_unit: inv.unit,
          suggested_quantity: r.quantity,
          suggested_unit: r.unit,
          confidence: 'high' as const,
          ai_suggested: true as const,
        }
      })

    return NextResponse.json(suggestions)
  } catch (e) {
    return authErrorResponse(e)
  }
}
