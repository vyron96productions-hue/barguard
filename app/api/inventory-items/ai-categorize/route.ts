import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AiCategorizeSuggestion {
  id: string
  name: string
  unit: string
  suggested_category: string
  item_type: 'beverage' | 'food'
}

const PRESET_CATEGORIES = [
  // Beverages
  'spirits', 'beer', 'wine', 'keg', 'mixer', 'non-alcoholic',
  'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac', 'liqueur',
  // Food
  'food', 'kitchen', 'produce', 'protein', 'dairy', 'dry goods',
  'sauces', 'condiments', 'dessert', 'supply',
  // Other
  'other',
]

// GET /api/inventory-items/ai-categorize
// Uses Claude to suggest a category for every item that has no category
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, name, unit, item_type, category')
      .eq('business_id', businessId)
      .is('category', null)
      .order('name')

    if (!items || items.length === 0) return NextResponse.json([])

    const SYSTEM = `You are a bar inventory management assistant. Assign the single best category to each inventory item.

Available categories:
Beverage: spirits, beer, wine, keg, mixer, non-alcoholic, rum, tequila, vodka, whiskey, gin, brandy, cognac, liqueur
Food: food, kitchen, produce, protein, dairy, dry goods, sauces, condiments, dessert, supply
Other: other

Rules:
- Use the most specific beverage subcategory when possible (e.g. "vodka" over "spirits" for Tito's Vodka)
- Liqueurs (Baileys, Kahlúa, Amaretto, Triple Sec, Chambord, Cointreau, etc.) → "liqueur"
- Wine bottles/cases → "wine". Beer bottles/cans/cases → "beer". Kegs → "keg".
- Mixers (tonic, club soda, juice, syrups) → "mixer"
- Food items → best matching food category. Supplies → "supply".
- If nothing fits → "other"

Return ONLY a JSON array, no markdown:
[{"id":"<exact id>","category":"<category>","item_type":"beverage|food"}]`

    const BATCH_SIZE = 50
    const batches: typeof items[] = []
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE))
    }

    type RawRow = { id: string; category: string; item_type: string }

    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        const itemList = batch.map((i) => `${i.id}|${i.name}|${i.unit}|${i.item_type ?? ''}`).join('\n')
        try {
          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: SYSTEM,
            messages: [{ role: 'user', content: `Items (id|name|unit|type):\n${itemList}` }],
          })
          const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
          const jsonMatch = text.match(/\[[\s\S]*\]/)
          if (!jsonMatch) return [] as RawRow[]
          return JSON.parse(jsonMatch[0]) as RawRow[]
        } catch {
          return [] as RawRow[]
        }
      })
    )

    const raw = batchResults.flat()
    const itemMap = new Map(items.map((i) => [i.id, i]))

    const suggestions: AiCategorizeSuggestion[] = raw
      .filter((s) => itemMap.has(s.id) && typeof s.category === 'string')
      .map((s) => {
        const item = itemMap.get(s.id)!
        const category = PRESET_CATEGORIES.includes(s.category.toLowerCase())
          ? s.category.toLowerCase()
          : s.category
        return {
          id: s.id,
          name: item.name,
          unit: item.unit,
          suggested_category: category,
          item_type: s.item_type === 'food' ? 'food' : 'beverage',
        }
      })

    return NextResponse.json(suggestions)
  } catch (e) {
    return authErrorResponse(e)
  }
}
