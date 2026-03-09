'use client'

import { useEffect, useState } from 'react'
import type { DrinkLibraryItem } from '@/types'

export default function DrinkLibraryPage() {
  const [items, setItems] = useState<DrinkLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DrinkLibraryItem | null>(null)

  useEffect(() => {
    fetch('/api/drink-library')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      const q = search.trim()
      fetch(`/api/drink-library${q ? `?q=${encodeURIComponent(q)}` : ''}`)
        .then((r) => r.json())
        .then((data) => setItems(Array.isArray(data) ? data : []))
    }, 200)
    return () => clearTimeout(handler)
  }, [search])

  // Auto-select first item on load
  useEffect(() => {
    if (items.length > 0 && !selected) setSelected(items[0])
  }, [items, selected])

  return (
    <div className="flex gap-0 h-[calc(100vh-6rem)] max-w-5xl overflow-hidden">
      {/* Left: search + list */}
      <div className="w-64 shrink-0 flex flex-col border-r border-gray-800">
        <div className="p-3 border-b border-gray-800">
          <h1 className="text-base font-bold text-gray-100 mb-2">Drink Library</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drinks…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-gray-600 text-xs p-4">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600 text-xs p-4">No drinks found.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800/50 transition-colors ${
                  selected?.id === item.id
                    ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                    : 'hover:bg-gray-800/40 border-l-2 border-l-transparent'
                }`}
              >
                <p className="text-sm font-medium text-gray-200">{item.name}</p>
                {item.category && (
                  <p className="text-xs text-gray-600 capitalize mt-0.5">{item.category}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: recipe detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <DrinkDetail item={selected} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Select a drink to view its recipe.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DrinkDetail({ item }: { item: DrinkLibraryItem }) {
  const totalCost = item.ingredients?.reduce((sum, ing) => {
    const cpo = ing.inventory_item?.cost_per_oz
    return sum + (cpo != null ? ing.quantity_oz * cpo : 0)
  }, 0) ?? 0
  const hasFullCost = item.ingredients?.every((ing) => ing.inventory_item?.cost_per_oz != null) ?? false

  return (
    <div className="space-y-6 max-w-lg">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-100">{item.name}</h2>
          {item.category && (
            <span className="mt-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize">
              {item.category}
            </span>
          )}
        </div>
        {item.aliases && item.aliases.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            Also known as: {item.aliases.map((a) => a.alias).join(', ')}
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 flex-wrap">
        {item.glassware && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Glass</p>
            <p className="text-sm text-gray-300 mt-0.5 capitalize">{item.glassware}</p>
          </div>
        )}
        {item.garnish && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Garnish</p>
            <p className="text-sm text-gray-300 mt-0.5">{item.garnish}</p>
          </div>
        )}
        {(hasFullCost || totalCost > 0) && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Est. Cost</p>
            <p className="text-sm text-emerald-400 mt-0.5 font-medium">
              ${totalCost.toFixed(2)}{!hasFullCost && <span className="text-gray-600"> (partial)</span>}
            </p>
          </div>
        )}
      </div>

      {/* Ingredients */}
      {item.ingredients && item.ingredients.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingredients</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {item.ingredients.map((ing, i) => (
              <div
                key={ing.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < item.ingredients!.length - 1 ? 'border-b border-gray-800/50' : ''
                }`}
              >
                <div>
                  <p className="text-sm text-gray-200">{ing.ingredient_name}</p>
                  {ing.notes && <p className="text-xs text-gray-600 mt-0.5">{ing.notes}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-amber-400">{ing.quantity_oz} oz</p>
                  {ing.inventory_item?.cost_per_oz != null && (
                    <p className="text-xs text-gray-600">${(ing.quantity_oz * ing.inventory_item.cost_per_oz).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {item.instructions && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-300 leading-relaxed">{item.instructions}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-sm text-gray-500">{item.notes}</p>
        </div>
      )}
    </div>
  )
}
