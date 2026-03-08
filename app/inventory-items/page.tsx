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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Inventory Items</h1>
        <p className="text-gray-500 mt-1">Physical items you track — bottles, kegs, cases.</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-medium text-gray-200">Add Item</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name (e.g. Tito's Vodka)"
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input
            value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 w-40"
          />
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 disabled:opacity-50">
            Add
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
          <p>No inventory items yet. Add your first item above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400">{cat}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-left">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-medium">{item.name}</td>
                    <td className="px-5 py-3 text-gray-400">{item.unit}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(item.id)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
