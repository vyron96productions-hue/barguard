'use client'

import { useEffect, useState } from 'react'
import type { MenuItem, InventoryItem } from '@/types'

type MenuItemWithRecipes = MenuItem & {
  menu_item_recipes: { id: string; quantity: number; unit: string; inventory_item: InventoryItem }[]
}

export default function RecipeMappingPage() {
  const [menuItems, setMenuItems]         = useState<MenuItemWithRecipes[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading]             = useState(true)

  // Add menu item form
  const [name, setName]         = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Inline ingredient add (per card)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [inlineInvId, setInlineInvId] = useState('')
  const [inlineQty, setInlineQty]     = useState('')
  const [inlineUnit, setInlineUnit]   = useState('oz')
  const [inlineErr, setInlineErr]     = useState<string | null>(null)
  const [inlineSaving, setInlineSaving] = useState(false)

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

  async function handleAddMenuItem(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError(null)
    const res = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setCategory('')
    await fetchAll()
    setSaving(false)
  }

  async function handleDeleteMenuItem(id: string) {
    if (!confirm('Delete this menu item and all its recipes?')) return
    await fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  function openExpanded(id: string) {
    setExpandedId(id === expandedId ? null : id)
    setInlineInvId(''); setInlineQty(''); setInlineUnit('oz'); setInlineErr(null)
  }

  async function handleAddIngredient(menuItemId: string) {
    if (!inlineInvId || !inlineQty) { setInlineErr('Select an ingredient and enter a quantity.'); return }
    setInlineSaving(true); setInlineErr(null)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_item_id: menuItemId,
        inventory_item_id: inlineInvId,
        quantity: parseFloat(inlineQty),
        unit: inlineUnit,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setInlineErr(data.error); setInlineSaving(false); return }
    setInlineInvId(''); setInlineQty('')
    await fetchAll()
    setInlineSaving(false)
  }

  async function handleDeleteRecipe(id: string) {
    await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' })
    fetchAll()
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add Menu Item</p>
        <div className="flex gap-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Mojito)"
            className="flex-1 bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-32 bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
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

      {/* Menu items */}
      {loading ? (
        <p className="text-slate-600 text-sm">Loading…</p>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-16 text-slate-700 border border-slate-800 rounded-2xl">
          <p className="text-3xl mb-3">◉</p>
          <p className="text-sm">No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menuItems.map((item) => {
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
                      <p className="font-semibold text-slate-200 text-sm truncate">{item.name}</p>
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
                            ~${estCost.toFixed(2)}/drink
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
                      <div key={r.id} className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-800/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
                            {r.quantity}{r.unit}
                          </span>
                          <span className="text-sm text-slate-400 truncate">{r.inventory_item?.name ?? '—'}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRecipe(r.id)}
                          className="text-xs text-slate-700 hover:text-red-400 transition-colors ml-3 shrink-0 py-0.5 px-1.5"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline add ingredient */}
                {isOpen && (
                  <div className="border-t border-amber-500/20 bg-amber-500/[0.03] px-4 sm:px-5 py-4">
                    <p className="text-[10px] text-amber-500/60 uppercase tracking-wider font-semibold mb-3">
                      Add ingredient to {item.name}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={inlineInvId}
                        onChange={(e) => setInlineInvId(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                      >
                        <option value="">Select ingredient…</option>
                        {inventoryItems.map((i) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
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
                          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                        >
                          {['oz', 'ml', 'cl'].map((u) => <option key={u} value={u}>{u}</option>)}
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
                  </div>
                )}
              </div>
            )
          })}
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
    </div>
  )
}
