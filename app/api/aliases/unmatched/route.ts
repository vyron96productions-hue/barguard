import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

const STRIP_WORDS = new Set([
  'shot', 'shots', 'neat', 'rocks', 'on', 'the', 'up', 'straight', 'chilled',
  'frozen', 'blended', 'and', 'with', 'service', 'a', 'of', 'cold', 'iced',
  'premium', 'top', 'shelf', 'house', 'well', 'draft', 'single', 'order', 'lt',
  'sm', 'lg', 'lrg', 'sm.', 'lg.', 'small', 'large', 'medium', 'reg', 'regular',
])

function cleanWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP_WORDS.has(w))
}

function scoreMatch(rawName: string, menuName: string): number {
  const rawWords  = cleanWords(rawName)
  const menuWords = cleanWords(menuName)
  if (menuWords.length === 0 || rawWords.length === 0) return 0
  // How many of the menu item's words appear in the raw POS name?
  const matched = menuWords.filter((w) => rawWords.includes(w)).length
  return matched / menuWords.length
}

export interface UnmatchedMenuItem {
  raw_name:   string
  suggestion: { id: string; name: string; confidence: 'high' | 'medium' | 'low' } | null
}

export interface UnmatchedData {
  menu_items:       UnmatchedMenuItem[]
  inventory_names:  string[]
}

export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [
      { data: salesUnmatched },
      { data: invUnmatched },
      { data: purchaseUnmatched },
      { data: menuItems },
      { data: inventoryItems },
    ] = await Promise.all([
      supabase.from('sales_transactions').select('raw_item_name').eq('business_id', businessId).is('menu_item_id', null),
      supabase.from('inventory_counts').select('raw_item_name').eq('business_id', businessId).is('inventory_item_id', null),
      supabase.from('purchases').select('raw_item_name').eq('business_id', businessId).is('inventory_item_id', null),
      supabase.from('menu_items').select('id, name').eq('business_id', businessId),
      supabase.from('inventory_items').select('id, name').eq('business_id', businessId),
    ])

    const uniqueRawMenuNames = [...new Set((salesUnmatched ?? []).map((r) => r.raw_item_name))]

    // Auto-suggest best matching menu item for each unlinked POS name
    const menuItemsList = menuItems ?? []
    const menuResult: UnmatchedMenuItem[] = uniqueRawMenuNames.map((rawName) => {
      let bestScore = 0
      let bestItem: { id: string; name: string } | null = null

      for (const mi of menuItemsList) {
        const score = scoreMatch(rawName, mi.name)
        if (score > bestScore) {
          bestScore = score
          bestItem = mi
        }
      }

      const suggestion = bestScore >= 0.5 && bestItem
        ? {
            id:         bestItem.id,
            name:       bestItem.name,
            confidence: bestScore >= 0.85 ? 'high' : bestScore >= 0.65 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
          }
        : null

      return { raw_name: rawName, suggestion }
    })

    const unmatchedInventoryNames = [...new Set([
      ...(invUnmatched     ?? []).map((r) => r.raw_item_name),
      ...(purchaseUnmatched ?? []).map((r) => r.raw_item_name),
    ])]

    // Auto-suggest best matching inventory item for each unlinked inv name
    const inventoryItemsList = inventoryItems ?? []
    const invResult = unmatchedInventoryNames.map((rawName) => {
      let bestScore = 0
      let bestItem: { id: string; name: string } | null = null
      for (const inv of inventoryItemsList) {
        const score = scoreMatch(rawName, inv.name)
        if (score > bestScore) { bestScore = score; bestItem = inv }
      }
      return {
        raw_name: rawName,
        suggestion: bestScore >= 0.5 && bestItem
          ? { id: bestItem.id, name: bestItem.name, confidence: (bestScore >= 0.85 ? 'high' : bestScore >= 0.65 ? 'medium' : 'low') as 'high' | 'medium' | 'low' }
          : null,
      }
    })

    return NextResponse.json({ menu_items: menuResult, inventory_items: invResult })
  } catch (e) { return authErrorResponse(e) }
}
