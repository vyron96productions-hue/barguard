// lib/recipe-suggestions.ts
// Smart name-matching algorithm for auto-generating recipes

export interface SuggestionMenuItem {
  id: string
  name: string
  item_type: string | null
}

export interface SuggestionInventoryItem {
  id: string
  name: string
  unit: string
  item_type: string | null
}

export interface RecipeSuggestion {
  menu_item_id: string
  menu_item_name: string
  inventory_item_id: string
  inventory_item_name: string
  inventory_item_unit: string
  suggested_quantity: number
  suggested_unit: string
  confidence: 'high' | 'medium' | 'low'
  ai_suggested?: boolean
}

// Words to strip from menu item names before matching
const STRIP_WORDS = new Set([
  'shot', 'shots', 'neat', 'rocks', 'on', 'the', 'up', 'straight', 'chilled',
  'frozen', 'blended', 'and', 'with', 'service', 'a', 'of', 'cold', 'iced',
  'premium', 'top', 'shelf', 'house', 'well', 'draft', 'single', 'order',
])

function cleanWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP_WORDS.has(w))
}

const FOOD_UNITS = new Set(['each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'bag', 'tray', 'box', 'jar', 'packet', 'flat'])

function detectPour(menuItemName: string, inventoryUnit?: string): { quantity: number; unit: string } {
  const n = menuItemName.toLowerCase()
  // Check menu item name first for explicit size keywords
  if (n.includes('bottle'))                      return { quantity: 1,   unit: 'bottle' }
  if (n.includes('pint') || n.includes('draft')) return { quantity: 1,   unit: 'pint'   }
  if (n.includes('can'))                         return { quantity: 1,   unit: 'can'    }
  if (n.includes('double') || n.includes('dbl')) return { quantity: 3,   unit: 'oz'     }
  if (n.includes('triple'))                      return { quantity: 4.5, unit: 'oz'     }
  if (n.includes('glass'))                       return { quantity: 5,   unit: 'oz'     } // wine glass
  // Fall back to inventory item's unit to handle beer cans, pints, food items
  if (inventoryUnit) {
    const u = inventoryUnit.toLowerCase()
    if (u === 'can')    return { quantity: 1, unit: 'can'    }
    if (u === 'pint')   return { quantity: 1, unit: 'pint'   }
    if (u === 'bottle') return { quantity: 1, unit: 'bottle' }
    if (u === 'each')   return { quantity: 1, unit: 'each'   }
    if (FOOD_UNITS.has(u)) return { quantity: 1, unit: u }
  }
  return { quantity: 1.5, unit: 'oz' }  // standard shot default
}

function scoreMatch(menuWords: string[], invName: string): number {
  const invWords = cleanWords(invName)
  if (invWords.length === 0) return 0
  const matched = invWords.filter((w) => menuWords.includes(w)).length
  return matched / invWords.length
}

export function generateSuggestions(
  menuItems: SuggestionMenuItem[],
  inventoryItems: SuggestionInventoryItem[],
  existingRecipeMenuItemIds: Set<string>,
): RecipeSuggestion[] {
  const suggestions: RecipeSuggestion[] = []

  // Only suggest for menu items that have no recipes yet
  const unrecipied = menuItems.filter((mi) => !existingRecipeMenuItemIds.has(mi.id))

  for (const mi of unrecipied) {
    const miWords = cleanWords(mi.name)

    // Match against inventory items of the same type (drinks→beverages, food→food)
    const candidates = inventoryItems.filter((inv) =>
      mi.item_type === 'food' ? inv.item_type === 'food' : inv.item_type !== 'food'
    )

    let bestScore = 0
    let bestInv: SuggestionInventoryItem | null = null

    for (const inv of candidates) {
      const score = scoreMatch(miWords, inv.name)
      if (score > bestScore) {
        bestScore = score
        bestInv = inv
      }
    }

    if (bestScore >= 0.5 && bestInv) {
      const { quantity, unit } = detectPour(mi.name, bestInv.unit)
      suggestions.push({
        menu_item_id: mi.id,
        menu_item_name: mi.name,
        inventory_item_id: bestInv.id,
        inventory_item_name: bestInv.name,
        inventory_item_unit: bestInv.unit,
        suggested_quantity: quantity,
        suggested_unit: unit,
        confidence: bestScore >= 0.85 ? 'high' : bestScore >= 0.65 ? 'medium' : 'low',
      })
    }
  }

  return suggestions
}
