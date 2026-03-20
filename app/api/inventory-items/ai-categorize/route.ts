import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

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
  'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac',
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

    const itemList = items
      .map((i) => `${i.id}|${i.name}|${i.unit}|${i.item_type ?? ''}`)
      .join('\n')

    const prompt = `You are a bar inventory management assistant. Assign the single best category to each inventory item below.

Available categories:
Beverage categories: spirits, beer, wine, keg, mixer, non-alcoholic, rum, tequila, vodka, whiskey, gin, brandy, cognac
Food categories: food, kitchen, produce, protein, dairy, dry goods, sauces, condiments, dessert, supply
Other: other

Rules:
- Use the most specific beverage subcategory when possible (e.g. "vodka" over "spirits" for Tito's Vodka)
- Wine bottles/cases → "wine"
- Beer bottles/cans/cases/kegs → "beer" or "keg" based on unit
- Mixers (tonic, club soda, juice, syrups) → "mixer"
- Food items → best matching food category
- Supplies (napkins, cups, etc.) → "supply"
- If nothing fits, use "other"

Return ONLY a JSON array with no markdown or explanation:
[{"id":"<exact id>","category":"<category>","item_type":"beverage|food"}]

Items (format: id|name|unit|current_item_type):
${itemList}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as { type: 'text'; text: string }).text.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })

    const raw = JSON.parse(jsonMatch[0]) as Array<{
      id: string
      category: string
      item_type: string
    }>

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
