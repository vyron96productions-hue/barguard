'use client'

import { useEffect, useState } from 'react'
import type { MenuItem, InventoryItem } from '@/types'

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<(MenuItem & { menu_item_recipes: { id: string; quantity: number; unit: string; inventory_item: InventoryItem }[] })[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add menu item form
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add recipe form
  const [recipeMenuId, setRecipeMenuId] = useState('')
  const [recipeInvId, setRecipeInvId] = useState('')
  const [recipeQty, setRecipeQty] = useState('')
  const [recipeUnit, setRecipeUnit] = useState('oz')
  const [recipeError, setRecipeError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Menu Items & Recipes</h1>
        <p className="text-gray-500 mt-1">Define what you sell and how much of each ingredient each drink uses.</p>
      </div>

      {/* Add menu item */}
      <form onSubmit={handleAddMenuItem} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-medium text-gray-200">Add Menu Item</h2>
        <div className="flex gap-3 flex-wrap">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Menu item name (e.g. Mojito)"
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 w-40" />
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 disabled:opacity-50">
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Add recipe */}
      <form onSubmit={handleAddRecipe} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-medium text-gray-200">Add Recipe Ingredient</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Menu Item</label>
            <select value={recipeMenuId} onChange={(e) => setRecipeMenuId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
              <option value="">Select…</option>
              {menuItems.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ingredient</label>
            <select value={recipeInvId} onChange={(e) => setRecipeInvId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
              <option value="">Select…</option>
              {inventoryItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantity</label>
            <input value={recipeQty} onChange={(e) => setRecipeQty(e.target.value)} type="number" step="0.01" placeholder="1.5"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 w-24" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit</label>
            <select value={recipeUnit} onChange={(e) => setRecipeUnit(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
              {['oz', 'ml', 'cl'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400">
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
          <p>No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-gray-100">{item.name}</span>
                  {item.category && <span className="ml-2 text-xs text-gray-500">{item.category}</span>}
                </div>
                <button onClick={() => handleDeleteMenuItem(item.id)}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors">Delete</button>
              </div>
              {item.menu_item_recipes.length === 0 ? (
                <p className="text-xs text-gray-600">No recipe ingredients yet.</p>
              ) : (
                <div className="space-y-1">
                  {item.menu_item_recipes.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/50 rounded px-3 py-1.5">
                      <span>{r.inventory_item?.name ?? '—'}</span>
                      <div className="flex items-center gap-4">
                        <span>{r.quantity} {r.unit}</span>
                        <button onClick={() => handleDeleteRecipe(r.id)}
                          className="text-xs text-gray-600 hover:text-red-400">Remove</button>
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
