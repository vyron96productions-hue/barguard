'use client'

import { useEffect, useState } from 'react'
import type { InventoryItem } from '@/types'

const UNITS = ['oz', 'ml', 'bottle', 'case', 'keg', 'halfkeg', 'quarterkeg', 'pint', 'l']

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('oz')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const res = await fetch('/api/inventory-items')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/inventory-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, unit, category }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setCategory('')
    fetchItems()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item? This may affect recipes and calculations.')) return
    await fetch(`/api/inventory-items?id=${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = item.category ?? 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Inventory Items</h1>
        <p className="text-gray-500 mt-1 text-sm">Physical items you track — bottles, kegs, cases.</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h2 className="font-medium text-gray-200">Add Item</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Tito's Vodka)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category (optional)</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Vodka"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Items list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🍾</p>
          <p className="text-sm">No inventory items yet. Add your first item above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-800 bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400">{cat}</h3>
            </div>
            <div className="divide-y divide-gray-800/50">
              {catItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="font-medium text-sm text-gray-200 truncate">{item.name}</p>
                    <span className="text-xs text-gray-500 shrink-0 bg-gray-800 px-2 py-0.5 rounded">{item.unit}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-gray-600 hover:text-red-400 active:text-red-300 transition-colors ml-3 shrink-0 py-1 px-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
