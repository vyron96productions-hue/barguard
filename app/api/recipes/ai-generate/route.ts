import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AiGenerateSuggestion {
  inventory_item_id: string
  inventory_item_name: string
  inventory_item_unit: string
  menu_item_name: string
  category: string
  item_type: 'drink' | 'food'
  sell_price: number | null
  quantity: number
  unit: string
}

// GET /api/recipes/ai-generate
// Uses Claude to suggest one menu item + recipe per inventory item
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [{ data: inventoryItems }, { data: existingMenuItems }] = await Promise.all([
      supabase.from('inventory_items').select('id, name, unit, category, item_type').eq('business_id', businessId),
      supabase.from('menu_items').select('name').eq('business_id', businessId),
    ])

    const existingNames = new Set((existingMenuItems ?? []).map((m) => m.name.toLowerCase().trim()))

    // Skip pure mixers/condiments — they're ingredients, not standalone menu items
    const skipKeywords = ['tonic water', 'club soda', 'simple syrup', 'grenadine', 'tabasco', 'worcestershire', 'lime juice', 'lemon juice', 'orange juice', 'cranberry juice', 'pineapple juice']
    const skipCategories = new Set(['condiment', 'supply', 'disposables', 'mixer'])

    const eligible = (inventoryItems ?? []).filter((item) => {
      const nameLower = item.name.toLowerCase()
      const catLower = (item.category ?? '').toLowerCase()
      if (skipCategories.has(catLower)) return false
      if (skipKeywords.some((k) => nameLower.includes(k))) return false
      return true
    })

    if (eligible.length === 0) return NextResponse.json([])

    const invMap = new Map(eligible.map((i) => [i.id, i]))

    // Batch to 50 items per call — prevents response truncation on large inventories
    const BATCH_SIZE = 50
    const batches: typeof eligible[] = []
    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      batches.push(eligible.slice(i, i + BATCH_SIZE))
    }

    const SYSTEM = `You are a bar management assistant. Given bar inventory items, generate ONE menu item per item that a bar would actually sell.

Rules by unit type:
- Spirits/liqueurs/cognac (bottle/1L/1.75L): menu item = brand name as-is, category="shot", qty=1.5, unit="oz", sell_price=typical bar price for that spirit tier
- Wine (bottle): menu item = "[Name] Glass", category="wine", qty=5, unit="oz", sell_price=8-14
- Beer bottle/can/pint: menu item = same name (clean it up), category="beer", qty=1, unit="each", sell_price=5-7
- Beer case (unit=case): menu item = same name without "case", category="beer", qty=0.0417, unit="case", sell_price=5-6
- Keg/sixthkeg: menu item = "[Name] Draft", category="beer", qty=1, unit="pint", sell_price=5-7
- Food (lb/kg/each/portion): menu item = clean name, category appropriate for food, item_type="food", qty=1, unit matching inventory, sell_price=estimate

Do NOT generate menu items for: juices used as mixers, syrups, sodas, condiments.
Return ONLY a JSON array, no markdown, no explanation.`

    type RawSuggestion = {
      inventory_item_id: string
      menu_item_name: string
      category: string
      item_type: string
      sell_price: number | null
      quantity: number
      unit: string
    }

    async function runBatch(items: typeof eligible): Promise<RawSuggestion[]> {
      const itemList = items
        .map((i) => `${i.id}|${i.name}|${i.unit}|${i.item_type ?? 'beverage'}|${i.category ?? ''}`)
        .join('\n')

      const prompt = `Items (format: id|name|unit|type|category):\n${itemList}\n\nReturn JSON array:\n[{"inventory_item_id":"<exact id>","menu_item_name":"<name>","category":"<cat>","item_type":"drink","sell_price":<number>,"quantity":<number>,"unit":"<unit>"}]`

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      })

      if (!response.content[0] || response.content[0].type !== 'text') return []
      const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('[ai-generate] batch parse failed, text snippet:', text.slice(0, 300))
        return []
      }
      try {
        return JSON.parse(jsonMatch[0]) as RawSuggestion[]
      } catch {
        console.error('[ai-generate] JSON.parse failed, snippet:', jsonMatch[0].slice(0, 300))
        return []
      }
    }

    const batchResults = await Promise.all(batches.map(runBatch))
    const raw = batchResults.flat()

    if (raw.length === 0) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    const suggestions: AiGenerateSuggestion[] = raw
      .filter((s) => invMap.has(s.inventory_item_id) && !existingNames.has(s.menu_item_name.toLowerCase().trim()))
      .map((s) => {
        const inv = invMap.get(s.inventory_item_id)!
        return {
          inventory_item_id: s.inventory_item_id,
          inventory_item_name: inv.name,
          inventory_item_unit: inv.unit,
          menu_item_name: s.menu_item_name,
          category: s.category,
          item_type: s.item_type === 'food' ? 'food' : 'drink',
          sell_price: typeof s.sell_price === 'number' ? s.sell_price : null,
          quantity: s.quantity,
          unit: s.unit,
        }
      })

    return NextResponse.json(suggestions)
  } catch (e) {
    return authErrorResponse(e)
  }
}
