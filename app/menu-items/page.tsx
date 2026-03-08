'use client'

import { useEffect, useState } from 'react'
import type { MenuItem, InventoryItem } from '@/types'

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<(MenuItem & { menu_item_recipes: { id: string; quantity: number; unit: string; inventory_item: InventoryItem }[] })[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [recipeMenuId, setRecipeMenuId] = useState('')
  const [recipeInvId, setRecipeInvId] = useState('')
  const [recipeQty, setRecipeQty] = useState('')
  const [recipeUnit, setRecipeUnit] = useState('oz')
  const [recipeError, setRecipeError] = useState<string | null>(null)

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
    fetchAll()
    setSaving(false)
  }

  async function handleDeleteMenuItem(id: string) {
    if (!confirm('Delete this menu item and all its recipes?')) return
    await fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleAddRecipe(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeMenuId || !recipeInvId || !recipeQty) return
    setRecipeError(null)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu_item_id: recipeMenuId, inventory_item_id: recipeInvId, quantity: parseFloat(recipeQty), unit: recipeUnit }),
    })
    const data = await res.json()
    if (!res.ok) { setRecipeError(data.error); return }
    setRecipeQty('')
    fetchAll()
  }

  async function handleDeleteRecipe(id: string) {
    await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Menu Items & Recipes</h1>
        <p className="text-gray-500 mt-1 text-sm">Define what you sell and how much of each ingredient each drink uses.</p>
      </div>

      {/* Add menu item */}
      <form onSubmit={handleAddMenuItem} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h2 className="font-medium text-gray-200">Add Menu Item</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Menu item name (e.g. Mojito)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600"
          />
          <div className="flex gap-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 px-5 py-2.5 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Add recipe */}
      <form onSubmit={handleAddRecipe} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h2 className="font-medium text-gray-200">Add Recipe Ingredient</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Menu Item</label>
            <select
              value={recipeMenuId}
              onChange={(e) => setRecipeMenuId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200"
            >
              <option value="">Select menu item…</option>
              {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ingredient</label>
            <select
              value={recipeInvId}
              onChange={(e) => setRecipeInvId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200"
            >
              <option value="">Select ingredient…</option>
              {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <input
                value={recipeQty}
                onChange={(e) => setRecipeQty(e.target.value)}
                type="number"
                step="0.01"
                placeholder="1.5"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={recipeUnit}
                onChange={(e) => setRecipeUnit(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200"
              >
                {['oz', 'ml', 'cl'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 active:bg-amber-300 transition-colors"
          >
            Add Ingredient
          </button>
        </div>
        {recipeError && <p className="text-red-400 text-sm">{recipeError}</p>}
      </form>

      {/* Menu items list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🍹</p>
          <p className="text-sm">No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-gray-100 text-sm sm:text-base block truncate">{item.name}</span>
                  {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                </div>
                <button
                  onClick={() => handleDeleteMenuItem(item.id)}
                  className="text-xs text-gray-600 hover:text-red-400 active:text-red-300 transition-colors shrink-0 py-1 px-2"
                >
                  Delete
                </button>
              </div>
              {item.menu_item_recipes.length === 0 ? (
                <p className="text-xs text-gray-600">No recipe ingredients yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {item.menu_item_recipes.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/50 rounded px-3 py-2">
                      <span className="truncate min-w-0 mr-3">{r.inventory_item?.name ?? '—'}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs whitespace-nowrap">{r.quantity} {r.unit}</span>
                        <button
                          onClick={() => handleDeleteRecipe(r.id)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
