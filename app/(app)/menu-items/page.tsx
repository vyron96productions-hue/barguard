'use client'

import { useEffect, useState } from 'react'
import type { MenuItem, InventoryItem } from '@/types'
import type { RecipeSuggestion } from '@/lib/recipe-suggestions'
import type { AiGenerateSuggestion } from '@/app/api/recipes/ai-generate/route'

type MenuItemWithRecipes = MenuItem & {
  sell_price: number | null
  item_type: 'drink' | 'food' | 'beer' | 'other'
  subcategory: string | null
  menu_item_recipes: { id: string; quantity: number; unit: string; inventory_item: InventoryItem }[]
}

interface WizardRow extends RecipeSuggestion {
  included: boolean
  edited_qty: string
  edited_unit: string
  edited_inv_id: string
}

interface AiGenRow extends AiGenerateSuggestion {
  included: boolean
  edited_name: string
  edited_category: string
  edited_sell_price: string
  edited_qty: string
  edited_unit: string
  edited_inv_id: string
}

const DRINK_CATEGORIES = ['cocktail', 'shot', 'beer', 'wine', 'non-alcoholic', 'spirits']
const FOOD_CATEGORIES  = ['entree', 'appetizer', 'side', 'dessert', 'salad', 'soup', 'sandwich', 'pizza', 'breakfast', 'kids']
const RECIPE_UNITS = ['oz', 'ml', 'cl', 'l', 'bottle', 'can', 'pint', 'each', 'piece', 'portion', 'slice', 'lb', 'g', 'cup', 'tbsp', 'tsp']

// Treat 'drink', 'beer', 'other', and undefined as drinks; only 'food' is food
function isFood(item_type: string | undefined | null) { return item_type === 'food' }
function isDrink(item_type: string | undefined | null) { return !isFood(item_type) }

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] shrink-0">{label}</p>
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-[10px] text-slate-700 shrink-0">{count}</span>
    </div>
  )
}

export default function RecipeMappingPage() {
  const [menuItems, setMenuItems]           = useState<MenuItemWithRecipes[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading]               = useState(true)

  // Add menu item form
  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('')
  const [itemType, setItemType]   = useState<'drink' | 'food'>('drink')
  const [sellPrice, setSellPrice] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'drink' | 'food'>('all')

  // Inline ingredient add (per card)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [inlineInvId, setInlineInvId] = useState('')
  const [inlineQty, setInlineQty]     = useState('')
  const [inlineUnit, setInlineUnit]   = useState('oz')
  const [inlineErr, setInlineErr]     = useState<string | null>(null)
  const [inlineSaving, setInlineSaving] = useState(false)
  const [inlineSearch, setInlineSearch] = useState('')
  const [inlineDropOpen, setInlineDropOpen] = useState(false)

  // Inline recipe editing
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [editRecipeInvId, setEditRecipeInvId] = useState('')
  const [editRecipeQty, setEditRecipeQty]     = useState('')
  const [editRecipeUnit, setEditRecipeUnit]   = useState('oz')
  const [editRecipeSaving, setEditRecipeSaving] = useState(false)
  const [editRecipeErr, setEditRecipeErr]     = useState<string | null>(null)
  const [recipeActionErr, setRecipeActionErr] = useState<string | null>(null)

  // Inline sell price editing
  const [editPriceId, setEditPriceId]   = useState<string | null>(null)
  const [editPriceVal, setEditPriceVal] = useState('')
  const [priceSaving, setPriceSaving]   = useState(false)

  // Auto-match wizard
  const [showWizard, setShowWizard]           = useState(false)
  const [suggestions, setSuggestions]         = useState<RecipeSuggestion[]>([])
  const [wizardRows, setWizardRows]           = useState<WizardRow[]>([])
  const [wizardSaving, setWizardSaving]       = useState(false)
  const [wizardDone, setWizardDone]           = useState(false)
  const [wizardError, setWizardError]         = useState<string | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [aiMatchLoading, setAiMatchLoading]   = useState(false)

  // AI Auto-Generate
  const [showAiGen, setShowAiGen]         = useState(false)
  const [aiGenRows, setAiGenRows]         = useState<AiGenRow[]>([])
  const [aiGenLoading, setAiGenLoading]   = useState(false)
  const [aiGenSaving, setAiGenSaving]     = useState(false)
  const [aiGenDone, setAiGenDone]         = useState(false)
  const [aiGenError, setAiGenError]       = useState<string | null>(null)
  const [aiGenSkipped, setAiGenSkipped]   = useState(0)

  // AI Bootstrap (no inventory items yet — generate ingredients + recipes from menu names)
  const [showBootstrap, setShowBootstrap]         = useState(false)
  const [bootstrapLoading, setBootstrapLoading]   = useState(false)
  const [bootstrapSaving, setBootstrapSaving]     = useState(false)
  const [bootstrapDone, setBootstrapDone]         = useState(false)
  const [bootstrapError, setBootstrapError]       = useState<string | null>(null)
  const [bootstrapResult, setBootstrapResult]     = useState<import('@/app/api/recipes/ai-bootstrap/route').BootstrapResult | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [menu, inv] = await Promise.all([
      fetch('/api/menu-items').then((r) => r.json()),
      fetch('/api/inventory-items').then((r) => r.json()),
    ])
    setMenuItems(Array.isArray(menu) ? menu : [])
    setInventoryItems(Array.isArray(inv) ? inv : [])
    setLoading(false)
  }

  async function openWizard() {
    setShowWizard(true)
    setSuggestionsLoading(true)
    setAiMatchLoading(false)

    // Step 1: fast word-match suggestions
    const res = await fetch('/api/recipes/suggestions')
    const data = await res.json()
    const wordSugs: RecipeSuggestion[] = Array.isArray(data) ? data : []
    setSuggestions(wordSugs)

    const toRows = (sugs: RecipeSuggestion[]) => sugs.map((s) => ({
      ...s,
      included: true,
      edited_qty: s.suggested_quantity.toString(),
      edited_unit: s.suggested_unit,
      edited_inv_id: s.inventory_item_id,
    }))

    setWizardRows(toRows(wordSugs))
    setSuggestionsLoading(false)

    // Step 2: AI match for items the word algorithm missed
    setAiMatchLoading(true)
    try {
      const aiRes = await fetch('/api/recipes/ai-match')
      const aiData = await aiRes.json()
      const aiSugs: RecipeSuggestion[] = Array.isArray(aiData) ? aiData : []

      // Merge: keep word-match for items it found, add AI for the rest
      const wordMatchedIds = new Set(wordSugs.map((s) => s.menu_item_id))
      const aiOnly = aiSugs.filter((s) => !wordMatchedIds.has(s.menu_item_id))

      const merged = [...wordSugs, ...aiOnly]
      setSuggestions(merged)
      setWizardRows(toRows(merged))
    } catch { /* AI match failing silently is fine — word-match results still show */ }
    setAiMatchLoading(false)
  }

  async function confirmWizard() {
    const selected = wizardRows.filter((r) => r.included && r.edited_inv_id && r.edited_qty)
    if (selected.length === 0) return
    setWizardSaving(true)
    setWizardError(null)
    try {
      const res = await fetch('/api/recipes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipes: selected.map((r) => ({
            menu_item_id: r.menu_item_id,
            inventory_item_id: r.edited_inv_id,
            quantity: parseFloat(r.edited_qty),
            unit: r.edited_unit,
          })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setWizardError(d?.error ?? 'Save failed — please try again')
        setWizardSaving(false)
        return
      }
    } catch {
      setWizardError('Network error — please try again')
      setWizardSaving(false)
      return
    }
    setWizardSaving(false)
    setWizardDone(true)
    setTimeout(() => {
      setShowWizard(false)
      setWizardDone(false)
      fetchAll()
    }, 1500)
  }

  async function openAiGen() {
    setShowAiGen(true)
    setAiGenLoading(true)
    setAiGenError(null)
    setAiGenDone(false)
    setAiGenSkipped(0)
    setAiGenRows([])
    try {
      const res = await fetch('/api/recipes/ai-generate')
      const data = await res.json()
      if (!res.ok) { setAiGenError(data.error ?? 'Failed to generate suggestions'); setAiGenLoading(false); return }
      const sugs: AiGenerateSuggestion[] = Array.isArray(data) ? data : []
      setAiGenRows(sugs.map((s) => ({
        ...s,
        included: true,
        edited_name: s.menu_item_name,
        edited_category: s.category,
        edited_sell_price: s.sell_price != null ? s.sell_price.toString() : '',
        edited_qty: s.quantity.toString(),
        edited_unit: s.unit,
        edited_inv_id: s.inventory_item_id,
      })))
    } catch {
      setAiGenError('Something went wrong. Try again.')
    }
    setAiGenLoading(false)
  }

  async function confirmAiGen() {
    const selected = aiGenRows.filter((r) => r.included && r.edited_name.trim() && r.edited_inv_id && r.edited_qty)
    if (selected.length === 0) return
    setAiGenSaving(true)

    // Step 1: bulk create menu items
    const bulkRes = await fetch('/api/menu-items/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: selected.map((r) => ({
          name: r.edited_name.trim(),
          category: r.edited_category || null,
          item_type: r.item_type,
          sell_price: r.edited_sell_price !== '' ? parseFloat(r.edited_sell_price) : null,
        })),
      }),
    })
    const bulkData = await bulkRes.json()
    if (!bulkRes.ok) { setAiGenError(bulkData.error ?? 'Failed to create menu items'); setAiGenSaving(false); return }

    if (bulkData.skipped_count > 0) setAiGenSkipped(bulkData.skipped_count)
    const createdItems: Array<{ id: string; name: string }> = bulkData.created ?? []
    const nameToId = new Map(createdItems.map((i) => [i.name.toLowerCase().trim(), i.id]))

    // Step 2: bulk create recipes
    const recipes = selected
      .map((r) => {
        const menuItemId = nameToId.get(r.edited_name.toLowerCase().trim())
        if (!menuItemId) return null
        return {
          menu_item_id: menuItemId,
          inventory_item_id: r.edited_inv_id,
          quantity: parseFloat(r.edited_qty),
          unit: r.edited_unit,
        }
      })
      .filter(Boolean)

    if (recipes.length > 0) {
      const recipeRes = await fetch('/api/recipes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes }),
      })
      if (!recipeRes.ok) {
        setAiGenError('Menu items created but recipes failed to save — please add recipes manually from Recipe Mapping.')
        setAiGenSaving(false)
        return
      }
    }

    setAiGenSaving(false)
    setAiGenDone(true)
    setTimeout(() => {
      setShowAiGen(false)
      setAiGenDone(false)
      fetchAll()
    }, 1800)
  }

  async function openBootstrap() {
    setShowBootstrap(true)
    setBootstrapLoading(true)
    setBootstrapError(null)
    setBootstrapDone(false)
    setBootstrapResult(null)
    try {
      const res = await fetch('/api/recipes/ai-bootstrap', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setBootstrapError(data.error ?? 'AI failed — please try again'); setBootstrapLoading(false); return }
      setBootstrapResult(data)
    } catch {
      setBootstrapError('Network error — please try again')
    }
    setBootstrapLoading(false)
  }

  async function confirmBootstrap() {
    if (!bootstrapResult) return
    setBootstrapSaving(true)
    setBootstrapError(null)
    try {
      const res = await fetch('/api/recipes/ai-bootstrap/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bootstrapResult),
      })
      const data = await res.json()
      if (!res.ok) { setBootstrapError(data.error ?? 'Save failed — please try again'); setBootstrapSaving(false); return }
      setBootstrapDone(true)
      setTimeout(() => { setShowBootstrap(false); setBootstrapDone(false); fetchAll() }, 1800)
    } catch {
      setBootstrapError('Network error — please try again')
    }
    setBootstrapSaving(false)
  }

  async function handleAddMenuItem(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError(null)
    const res = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, item_type: itemType, sell_price: sellPrice ? parseFloat(sellPrice) : null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setCategory(''); setSellPrice(''); setItemType('drink')
    await fetchAll()
    setSaving(false)
  }

  async function handleDeleteMenuItem(id: string) {
    if (!confirm('Delete this menu item and all its recipes?')) return
    const res = await fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Delete failed — please try again')
      return
    }
    fetchAll()
  }

  function openExpanded(id: string) {
    setExpandedId(id === expandedId ? null : id)
    setInlineInvId(''); setInlineQty(''); setInlineUnit('oz'); setInlineErr(null)
    setInlineSearch(''); setInlineDropOpen(false)
  }

  function cancelAddIngredient() {
    setExpandedId(null)
    setInlineInvId(''); setInlineQty(''); setInlineUnit('oz'); setInlineErr(null)
    setInlineSearch(''); setInlineDropOpen(false)
  }

  async function handleAddIngredient(menuItemId: string) {
    const parsedQty = parseFloat(inlineQty)
    if (!inlineInvId || !inlineQty || isNaN(parsedQty) || parsedQty <= 0) {
      setInlineErr('Select an ingredient and enter a valid quantity greater than 0.')
      return
    }
    setInlineSaving(true); setInlineErr(null)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_item_id: menuItemId,
        inventory_item_id: inlineInvId,
        quantity: parsedQty,
        unit: inlineUnit,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setInlineErr(data.error); setInlineSaving(false); return }
    setInlineInvId(''); setInlineQty(''); setInlineSearch(''); setInlineDropOpen(false)
    await fetchAll()
    setInlineSaving(false)
  }

  async function handleDeleteRecipe(id: string) {
    setRecipeActionErr(null)
    const res = await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setRecipeActionErr(d?.error ?? 'Failed to delete ingredient')
      return
    }
    fetchAll()
  }

  function startEditRecipe(r: { id: string; quantity: number; unit: string; inventory_item?: { id: string } }) {
    setEditingRecipeId(r.id)
    setEditRecipeInvId(r.inventory_item?.id ?? '')
    setEditRecipeQty(r.quantity.toString())
    setEditRecipeUnit(r.unit)
  }

  async function saveEditRecipe() {
    if (!editingRecipeId) return
    const parsedQty = parseFloat(editRecipeQty)
    if (!editRecipeInvId || isNaN(parsedQty) || parsedQty <= 0) {
      setEditRecipeErr('Select an ingredient and enter a valid quantity greater than 0.')
      return
    }
    setEditRecipeSaving(true)
    setEditRecipeErr(null)
    const res = await fetch(`/api/recipes?id=${editingRecipeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory_item_id: editRecipeInvId, quantity: parsedQty, unit: editRecipeUnit }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setEditRecipeErr(d?.error ?? 'Save failed — please try again')
      setEditRecipeSaving(false)
      return
    }
    setEditingRecipeId(null)
    setEditRecipeErr(null)
    setEditRecipeSaving(false)
    fetchAll()
  }

  async function toggleItemType(item: MenuItemWithRecipes) {
    const newType = isFood(item.item_type) ? 'drink' : 'food'
    // Optimistic update
    setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, item_type: newType as 'drink' | 'food' | 'beer' | 'other' } : i))
    await fetch('/api/menu-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, item_type: newType }),
    })
  }

  async function saveSellPrice(menuItemId: string) {
    setPriceSaving(true)
    const res = await fetch('/api/menu-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: menuItemId, sell_price: editPriceVal || null }),
    })
    setPriceSaving(false)
    if (!res.ok) return // keep edit open so user can retry
    setEditPriceId(null)
    setMenuItems((prev) => prev.map((i) =>
      i.id === menuItemId
        ? { ...i, sell_price: editPriceVal !== '' ? parseFloat(editPriceVal) : null }
        : i
    ))
  }

  const drinkItems = menuItems.filter(i => isDrink(i.item_type))
  const foodItems  = menuItems.filter(i => isFood(i.item_type))

  const filteredMenuItems = typeFilter === 'all'
    ? menuItems
    : typeFilter === 'food'
      ? foodItems
      : drinkItems

  const showTypeSections = typeFilter === 'all' && drinkItems.length > 0 && foodItems.length > 0

  // suppress unused variable warning — suggestions state is used for wizard reset
  void suggestions

  function renderItemCard(item: MenuItemWithRecipes) {
    const isOpen = expandedId === item.id
    const hasCosts = item.menu_item_recipes.some(
      (r) => (r.inventory_item as InventoryItem & { cost_per_oz?: number | null })?.cost_per_oz != null
    )
    const estCost = item.menu_item_recipes.reduce((sum, r) => {
      const cpo = (r.inventory_item as InventoryItem & { cost_per_oz?: number | null })?.cost_per_oz
      return sum + (cpo != null ? r.quantity * cpo : 0)
    }, 0)

    return (
      <div
        key={item.id}
        className={`bg-slate-900/60 border rounded-2xl overflow-hidden transition-colors ${
          isOpen ? 'border-slate-700' : 'border-slate-800'
        }`}
      >
        {/* Item header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-200 text-sm truncate">{item.name}</p>
                <button
                  onClick={() => toggleItemType(item)}
                  title={isFood(item.item_type) ? 'Click to mark as drink' : 'Click to mark as food'}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 transition-colors ${
                    isFood(item.item_type)
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-400/80 hover:bg-orange-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-600 hover:text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {isFood(item.item_type) ? 'food' : 'drink'}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {item.category && (
                  <span className="text-xs text-slate-600">{item.category}</span>
                )}
                <span className="text-xs text-slate-700">
                  {item.menu_item_recipes.length === 0
                    ? 'no ingredients'
                    : `${item.menu_item_recipes.length} ingredient${item.menu_item_recipes.length !== 1 ? 's' : ''}`}
                </span>
                {hasCosts && estCost > 0 && (
                  <span className="text-[10px] text-slate-600 tabular-nums">
                    ~${estCost.toFixed(2)} cost
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Sell price inline edit */}
            {editPriceId === item.id ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    value={editPriceVal}
                    onChange={(e) => setEditPriceVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveSellPrice(item.id)
                      if (e.key === 'Escape') setEditPriceId(null)
                    }}
                    placeholder="0.00"
                    className="w-20 bg-slate-800 border border-amber-500/40 rounded px-2 pl-5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => saveSellPrice(item.id)}
                  disabled={priceSaving}
                  className="text-xs px-2 py-1 bg-amber-500 text-slate-900 font-semibold rounded hover:bg-amber-400 disabled:opacity-50"
                >
                  {priceSaving ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditPriceId(null)} className="text-xs text-slate-600 hover:text-slate-400 px-1">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditPriceId(item.id); setEditPriceVal(item.sell_price?.toString() ?? '') }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  item.sell_price != null
                    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-600 border-slate-700 bg-slate-800/60 hover:text-slate-400'
                }`}
                title="Set sell price"
              >
                {item.sell_price != null ? `$${item.sell_price.toFixed(2)}` : '+ Price'}
              </button>
            )}
            <button
              onClick={() => openExpanded(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isOpen
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {isOpen ? 'Done' : '+ Ingredient'}
            </button>
            <button
              onClick={() => handleDeleteMenuItem(item.id)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 transition-colors"
              title="Delete item"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ingredient list */}
        {item.menu_item_recipes.length > 0 && (
          <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
            {item.menu_item_recipes.map((r) => (
              <div key={r.id} className="px-4 sm:px-5 py-2.5 bg-slate-800/20">
                {editingRecipeId === r.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={editRecipeInvId}
                      onChange={(e) => setEditRecipeInvId(e.target.value)}
                      className="flex-1 min-w-0 bg-slate-800 border border-amber-500/40 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                    >
                      {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={editRecipeQty}
                      onChange={(e) => setEditRecipeQty(e.target.value)}
                      className="w-16 bg-slate-800 border border-amber-500/40 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                    <select
                      value={editRecipeUnit}
                      onChange={(e) => setEditRecipeUnit(e.target.value)}
                      className="w-20 bg-slate-800 border border-amber-500/40 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                    >
                      {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button
                      onClick={saveEditRecipe}
                      disabled={editRecipeSaving}
                      className="text-xs px-2.5 py-1.5 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors shrink-0"
                    >
                      {editRecipeSaving ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingRecipeId(null); setEditRecipeErr(null) }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                    {editRecipeErr && <p className="text-xs text-red-400 w-full">{editRecipeErr}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
                        {r.quantity}{r.unit}
                      </span>
                      <span className="text-sm text-slate-400 truncate">{r.inventory_item?.name ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        onClick={() => startEditRecipe(r)}
                        className="text-xs text-slate-600 hover:text-amber-400 transition-colors py-0.5 px-1.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(r.id)}
                        className="text-xs text-slate-700 hover:text-red-400 transition-colors py-0.5 px-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inline add ingredient */}
        {isOpen && (
          <div className="border-t border-amber-500/20 bg-amber-500/[0.03] px-4 sm:px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-amber-500/60 uppercase tracking-wider font-semibold">
                Add ingredient to {item.name}
              </p>
              <button
                onClick={cancelAddIngredient}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Searchable ingredient combobox */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search ingredient…"
                  value={inlineSearch}
                  onChange={(e) => { setInlineSearch(e.target.value); setInlineDropOpen(true) }}
                  onFocus={() => setInlineDropOpen(true)}
                  onBlur={() => setTimeout(() => setInlineDropOpen(false), 150)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-500"
                />
                {inlineInvId && !inlineDropOpen && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 pointer-events-none">
                    ✓
                  </span>
                )}
                {inlineDropOpen && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {inventoryItems
                      .filter((inv) => inv.name.toLowerCase().includes(inlineSearch.toLowerCase()))
                      .length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-500">No ingredients match</p>
                    ) : (
                      inventoryItems
                        .filter((inv) => inv.name.toLowerCase().includes(inlineSearch.toLowerCase()))
                        .map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onMouseDown={() => {
                              setInlineInvId(inv.id)
                              setInlineSearch(inv.name)
                              setInlineDropOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                              inlineInvId === inv.id ? 'text-amber-400 bg-slate-700/50' : 'text-slate-200'
                            }`}
                          >
                            {inv.name}
                            <span className="text-slate-500 text-xs ml-1">({inv.unit})</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 sm:w-44">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={inlineQty}
                  onChange={(e) => setInlineQty(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 min-w-0"
                />
                <select
                  value={inlineUnit}
                  onChange={(e) => setInlineUnit(e.target.value)}
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                >
                  {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleAddIngredient(item.id)}
                disabled={inlineSaving}
                className="shrink-0 px-4 py-2 bg-amber-500 text-slate-900 text-sm font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {inlineSaving ? '…' : 'Add'}
              </button>
            </div>
            {inlineErr && <p className="text-red-400 text-xs mt-2">{inlineErr}</p>}
            {recipeActionErr && <p className="text-red-400 text-xs mt-2">{recipeActionErr}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Recipe Mapping</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
              Manager
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Maps each menu item to its inventory ingredients. Drives variance and loss calculations.
          </p>
        </div>
      </div>

      {/* Add menu item */}
      <form onSubmit={handleAddMenuItem} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Menu Item</p>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
            {(['drink', 'food'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setItemType(t)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  itemType === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'drink' ? 'Drink' : 'Food'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={itemType === 'food' ? 'Item name (e.g. Cheeseburger, Wings)' : 'Item name (e.g. Mojito, Margarita)'}
            className="flex-1 min-w-0 bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-32 bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
          >
            <option value="">Category…</option>
            {(itemType === 'food' ? FOOD_CATEGORIES : DRINK_CATEGORIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Price"
              className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 px-4 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </form>

      {/* AI Recipe panel — always visible when menu items exist */}
      {menuItems.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-4 sm:px-5 py-4 space-y-3">
          {inventoryItems.length === 0 ? (
            /* Bootstrap mode — no inventory items yet */
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-400">AI Setup Recipes</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No inventory items yet. AI will infer your ingredients from your menu and set up recipes automatically.
                </p>
              </div>
              <button
                onClick={openBootstrap}
                className="shrink-0 px-4 py-2 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                AI Setup
              </button>
            </div>
          ) : (
            /* Normal mode — inventory items exist */
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-400">AI Auto-Generate</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Let AI build your entire recipe list from your inventory in one click.
                  </p>
                </div>
                <button
                  onClick={openAiGen}
                  className="shrink-0 px-4 py-2 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  AI Generate
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-amber-500/10">
                <div>
                  <p className="text-sm font-semibold text-slate-400">Auto-Match Existing</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Link existing menu items to inventory items by name matching.
                  </p>
                </div>
                <button
                  onClick={openWizard}
                  className="shrink-0 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Auto-Match
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Type filter — only shown when items exist */}
      {menuItems.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
          {(['all', 'drink', 'food'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all'
                ? `All (${menuItems.length})`
                : t === 'drink'
                  ? `Drinks (${drinkItems.length})`
                  : `Food (${foodItems.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      {loading ? (
        <p className="text-slate-600 text-sm">Loading…</p>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-16 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-3xl mb-3">◉</p>
          <p className="text-sm">No menu items yet. Add your first item above.</p>
        </div>
      ) : showTypeSections ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <SectionDivider label="Drinks" count={drinkItems.length} />
            {drinkItems.map((item) => renderItemCard(item))}
          </div>
          <div className="space-y-3">
            <SectionDivider label="Food" count={foodItems.length} />
            {foodItems.map((item) => renderItemCard(item))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMenuItems.map((item) => renderItemCard(item))}
        </div>
      )}

      {/* Context note */}
      {!loading && menuItems.length > 0 && (
        <p className="text-[11px] text-slate-700 text-center pt-2">
          Recipes here power loss detection on the{' '}
          <a href="/variance-reports" className="text-slate-600 hover:text-slate-400 underline underline-offset-2">Loss Reports</a>
          {' '}and{' '}
          <a href="/profit-intelligence" className="text-slate-600 hover:text-slate-400 underline underline-offset-2">Profit Intelligence</a>
          {' '}pages.
        </p>
      )}

      {/* AI Auto-Generate overlay */}
      {showAiGen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">AI Auto-Generate Recipes</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Review AI-suggested menu items. Edit names, prices, or quantities before saving.
                  </p>
                </div>
                <button onClick={() => setShowAiGen(false)} className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1 mt-1">✕</button>
              </div>

              {aiGenLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">AI is building your recipe list…</p>
                </div>
              ) : aiGenDone ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">✓</p>
                  <p className="text-lg font-semibold text-emerald-400">Menu items & recipes saved!</p>
                  {aiGenSkipped > 0 && (
                    <p className="text-xs text-amber-400">{aiGenSkipped} item{aiGenSkipped > 1 ? 's' : ''} already existed and were skipped — recipes were still linked.</p>
                  )}
                </div>
              ) : aiGenError ? (
                <div className="text-center py-16 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-sm">{aiGenError}</p>
                  <button onClick={openAiGen} className="mt-4 text-xs text-amber-400 hover:underline">Try again</button>
                </div>
              ) : aiGenRows.length === 0 ? (
                <div className="text-center py-16 border border-slate-800 border-dashed rounded-2xl text-slate-600">
                  <p className="text-3xl mb-3">◉</p>
                  <p className="text-sm">No new menu items to generate.</p>
                  <p className="text-xs mt-1 text-slate-700">All inventory items may already have menu items linked.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column headers — desktop */}
                  <div className="hidden sm:grid grid-cols-[24px_1fr_100px_90px_1fr_80px_80px] gap-2 px-3 pb-1">
                    {['', 'Menu Item Name', 'Category', 'Sell Price', '→ Inventory Item', 'Qty', 'Unit'].map((h) => (
                      <p key={h} className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">{h}</p>
                    ))}
                  </div>
                  {aiGenRows.map((row, idx) => (
                    <div key={idx} className={`bg-slate-900 border rounded-xl p-3 transition-colors ${row.included ? 'border-slate-700' : 'border-slate-800/60 opacity-40'}`}>
                      {/* Mobile */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="checkbox"
                            checked={row.included}
                            onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, included: e.target.checked } : r))}
                            className="w-4 h-4 accent-amber-500 shrink-0"
                          />
                          <input
                            value={row.edited_name}
                            onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_name: e.target.value } : r))}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={row.edited_category}
                            onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_category: e.target.value } : r))}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                          >
                            {(row.item_type === 'food' ? FOOD_CATEGORIES : DRINK_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                            <input type="number" min="0" step="0.5" value={row.edited_sell_price} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_sell_price: e.target.value } : r))} placeholder="Price" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60" />
                          </div>
                        </div>
                        <div className="flex gap-2 items-center text-xs text-slate-500">
                          <span>→</span>
                          <select value={row.edited_inv_id} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_inv_id: e.target.value } : r))} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60">
                            {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                          <input type="number" step="0.01" value={row.edited_qty} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_qty: e.target.value } : r))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60" />
                          <select value={row.edited_unit} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_unit: e.target.value } : r))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60">
                            {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-[24px_1fr_100px_90px_1fr_80px_80px] gap-2 items-center">
                        <input type="checkbox" checked={row.included} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, included: e.target.checked } : r))} className="w-4 h-4 accent-amber-500" />
                        <input value={row.edited_name} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_name: e.target.value } : r))} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 w-full" />
                        <select value={row.edited_category} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_category: e.target.value } : r))} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 w-full">
                          {(row.item_type === 'food' ? FOOD_CATEGORIES : DRINK_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                          <input type="number" min="0" step="0.5" value={row.edited_sell_price} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_sell_price: e.target.value } : r))} placeholder="—" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-5 pr-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60" />
                        </div>
                        <select value={row.edited_inv_id} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_inv_id: e.target.value } : r))} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 w-full">
                          {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input type="number" step="0.01" value={row.edited_qty} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_qty: e.target.value } : r))} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 w-full" />
                        <select value={row.edited_unit} onChange={(e) => setAiGenRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_unit: e.target.value } : r))} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 w-full">
                          {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          {!aiGenLoading && !aiGenDone && aiGenRows.length > 0 && (
            <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-4">
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-xs text-slate-500">{aiGenRows.filter((r) => r.included).length} of {aiGenRows.length} selected</p>
                  <button onClick={() => setAiGenRows((prev) => prev.map((r) => ({ ...r, included: true })))} className="text-xs text-amber-400 hover:underline">Select all</button>
                  <button onClick={() => setAiGenRows((prev) => prev.map((r) => ({ ...r, included: false })))} className="text-xs text-slate-600 hover:text-slate-400">Deselect all</button>
                </div>
                <div className="flex gap-3">
                  {aiGenError && <p className="text-xs text-red-400">{aiGenError}</p>}
                  <button onClick={() => setShowAiGen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                  <button
                    onClick={confirmAiGen}
                    disabled={aiGenSaving || aiGenRows.filter((r) => r.included).length === 0}
                    className="px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {aiGenSaving ? 'Saving…' : `Save ${aiGenRows.filter((r) => r.included).length} Items`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-match wizard overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              {/* Wizard header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Auto-Match Recipes</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Review the suggested links below. Edit any row before confirming.
                  </p>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1 mt-1"
                >
                  ✕
                </button>
              </div>

              {suggestionsLoading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Finding matches…</p>
              ) : aiMatchLoading ? (
                <div className="py-6 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
                    <p className="text-sm text-purple-300">AI matching cocktails and recipes…</p>
                  </div>
                  {wizardRows.length > 0 && (
                    <p className="text-xs text-slate-600">{wizardRows.length} word-match results found · checking for more…</p>
                  )}
                </div>
              ) : wizardDone ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">✓</p>
                  <p className="text-lg font-semibold text-emerald-400">Recipes saved!</p>
                </div>
              ) : wizardRows.length === 0 ? (
                <div className="text-center py-16 border border-slate-800 border-dashed rounded-2xl text-slate-600">
                  <p className="text-3xl mb-3">◉</p>
                  <p className="text-sm">No automatic matches found.</p>
                  <p className="text-xs mt-1 text-slate-700">Make sure inventory items are named similarly to your menu items.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {wizardRows.map((row, idx) => (
                      <div
                        key={row.menu_item_id}
                        className={`bg-slate-900 border rounded-xl p-3 sm:p-4 transition-colors ${
                          row.included ? 'border-slate-700' : 'border-slate-800 opacity-50'
                        }`}
                      >
                        {/* Mobile layout */}
                        <div className="space-y-2 sm:hidden">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-200">{row.menu_item_name}</p>
                            <input
                              type="checkbox"
                              checked={row.included}
                              onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, included: e.target.checked } : r))}
                              className="w-4 h-4 accent-amber-500 shrink-0"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>→</span>
                            <select
                              value={row.edited_inv_id}
                              onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_inv_id: e.target.value } : r))}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                            >
                              {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.5"
                              value={row.edited_qty}
                              onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_qty: e.target.value } : r))}
                              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                            />
                            <select
                              value={row.edited_unit}
                              onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_unit: e.target.value } : r))}
                              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                            >
                              {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                            {row.ai_suggested ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">AI</span>
                            ) : (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                row.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                row.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}>{row.confidence}</span>
                            )}
                          </div>
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden sm:flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={row.included}
                            onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, included: e.target.checked } : r))}
                            className="w-4 h-4 accent-amber-500 shrink-0"
                          />
                          <p className="w-44 text-sm font-medium text-slate-200 truncate shrink-0">{row.menu_item_name}</p>
                          <span className="text-slate-600 shrink-0">→</span>
                          <select
                            value={row.edited_inv_id}
                            onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_inv_id: e.target.value } : r))}
                            className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                          >
                            {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                          <input
                            type="number"
                            step="0.5"
                            value={row.edited_qty}
                            onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_qty: e.target.value } : r))}
                            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 shrink-0"
                          />
                          <select
                            value={row.edited_unit}
                            onChange={(e) => setWizardRows((prev) => prev.map((r, i) => i === idx ? { ...r, edited_unit: e.target.value } : r))}
                            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 shrink-0"
                          >
                            {RECIPE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                          {row.ai_suggested ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 bg-purple-500/10 text-purple-400 border border-purple-500/20">AI</span>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                              row.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              row.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}>{row.confidence}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          {!suggestionsLoading && !aiMatchLoading && !wizardDone && wizardRows.length > 0 && (
            <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-4">
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-slate-500">
                    {wizardRows.filter((r) => r.included).length} of {wizardRows.length} selected
                  </p>
                  {wizardError && <p className="text-xs text-red-400">{wizardError}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmWizard}
                    disabled={wizardSaving || wizardRows.filter((r) => r.included).length === 0}
                    className="px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {wizardSaving ? 'Saving…' : `Confirm ${wizardRows.filter((r) => r.included).length} Matches`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Bootstrap overlay */}
      {showBootstrap && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">AI Recipe Setup</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    AI will create your inventory items (ingredients) and link them to your menu items.
                  </p>
                </div>
                <button onClick={() => setShowBootstrap(false)} className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1 mt-1">✕</button>
              </div>

              {bootstrapLoading && (
                <div className="text-center py-12 space-y-3">
                  <div className="text-3xl animate-pulse">✦</div>
                  <p className="text-slate-400 text-sm">AI is analyzing your menu and building your ingredient list…</p>
                </div>
              )}

              {bootstrapError && !bootstrapResult && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-red-400 text-sm">{bootstrapError}</p>
                  <button onClick={openBootstrap} className="text-xs text-amber-400 hover:underline">Try again</button>
                </div>
              )}

              {bootstrapDone && (
                <div className="text-center py-8">
                  <p className="text-green-400 font-semibold">All set! Ingredients and recipes saved.</p>
                </div>
              )}

              {bootstrapResult && !bootstrapLoading && !bootstrapDone && (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-2">
                      Inventory items to create ({bootstrapResult.ingredients.length})
                    </p>
                    <div className="bg-slate-900 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {bootstrapResult.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-slate-200">{ing.name}</span>
                          <span className="text-slate-500 text-xs">{ing.unit} · {ing.item_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-2">
                      Recipes to create ({bootstrapResult.recipes.length})
                    </p>
                    <div className="bg-slate-900 rounded-xl divide-y divide-slate-800 max-h-64 overflow-y-auto">
                      {bootstrapResult.recipes.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-slate-200">{r.menu_item_name}</span>
                          <span className="text-slate-500 text-xs">{r.quantity} {r.unit} {r.ingredient_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {bootstrapError && <p className="text-red-400 text-sm text-center">{bootstrapError}</p>}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowBootstrap(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                    <button
                      onClick={confirmBootstrap}
                      disabled={bootstrapSaving}
                      className="px-5 py-2 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {bootstrapSaving ? 'Saving…' : 'Confirm & Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
