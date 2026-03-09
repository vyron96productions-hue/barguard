'use client'

import { useEffect, useState, useRef } from 'react'
import CategoryCombobox from '@/components/CategoryCombobox'
import { formatPackBreakdown } from '@/lib/beer-packaging'

interface StockItem {
  id: string
  name: string
  unit: string
  category: string | null
  pack_size: number | null
  package_type: string | null
  quantity_on_hand: number | null
  count_date: string | null
}

type FilterCategory = 'all' | string

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function staleness(item: StockItem): 'fresh' | 'aging' | 'stale' | 'never' {
  if (!item.count_date) return 'never'
  const d = daysAgo(item.count_date)
  if (d <= 7) return 'fresh'
  if (d <= 30) return 'aging'
  return 'stale'
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/stock-levels')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category ?? 'Uncategorized'))).sort()]
  const allCategories = [...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort()

  const visible = items.filter((item) => {
    const matchesCat = filter === 'all' || (item.category ?? 'Uncategorized') === filter
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const grouped = visible.reduce<Record<string, StockItem[]>>((acc, item) => {
    const cat = item.category ?? 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const countedCount = items.filter((i) => i.count_date !== null).length
  const lastCountDate = items
    .map((i) => i.count_date)
    .filter(Boolean)
    .sort()
    .at(-1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading stock levels…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Current Stock Levels</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {countedCount} of {items.length} items counted
            {lastCountDate && ` · last count ${new Date(lastCountDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>
        <a
          href="/uploads"
          className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          + Upload Count
        </a>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Counted ≤7 days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Counted 8–30 days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Counted 30+ days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" />Never counted</span>
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
        />
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                filter === cat ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🍾</p>
          <p className="text-slate-300 font-medium">No inventory items yet</p>
          <p className="text-slate-500 text-sm mt-1">Add items in Inventory, then upload a count CSV.</p>
          <div className="flex gap-3 justify-center mt-4">
            <a href="/inventory-items" className="text-sm text-amber-400 hover:underline">Add Items →</a>
            <a href="/uploads" className="text-sm text-amber-400 hover:underline">Upload Count →</a>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">No items match your search.</p>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cat}</h2>
              <span className="text-xs text-slate-600">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {catItems.map((item) => (
                <StockCard
                  key={item.id}
                  item={item}
                  allCategories={allCategories}
                  onUpdate={(updated) =>
                    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)))
                  }
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function StockCard({ item, allCategories, onUpdate }: {
  item: StockItem
  allCategories: string[]
  onUpdate: (updated: Partial<StockItem> & { id: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category ?? '')
  const [unit, setUnit] = useState(item.unit)
  const [quantity, setQuantity] = useState(item.quantity_on_hand?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  function openEdit() {
    setName(item.name)
    setCategory(item.category ?? '')
    setUnit(item.unit)
    setQuantity(item.quantity_on_hand?.toString() ?? '')
    setErr(null)
    setEditing(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  async function handleSave() {
    if (!name.trim()) { setErr('Name required'); return }
    if (!unit) { setErr('Unit required'); return }
    setSaving(true)
    setErr(null)
    const res = await fetch('/api/stock-levels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        name: name.trim(),
        category: category || null,
        unit,
        quantity_on_hand: quantity !== '' ? parseFloat(quantity) : null,
        package_type: item.package_type ?? null,
        pack_size: item.pack_size ?? null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'Save failed'); return }
    onUpdate({
      id: item.id,
      name: name.trim(),
      category: category || null,
      unit,
      quantity_on_hand: quantity !== '' ? parseFloat(quantity) : item.quantity_on_hand,
      count_date: quantity !== '' ? new Date().toISOString().slice(0, 10) : item.count_date,
    })
    setEditing(false)
  }

  const status = staleness(item)
  const dotColor = { fresh: 'bg-emerald-400', aging: 'bg-amber-400', stale: 'bg-red-400', never: 'bg-slate-600' }[status]
  const qtyColor = item.quantity_on_hand === null ? 'text-slate-600' : item.quantity_on_hand === 0 ? 'text-red-400' : 'text-gray-100'

  if (editing) {
    return (
      <div className="bg-gray-900 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Edit Item</p>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Category</label>
            <div className="mt-1">
              <CategoryCombobox
                value={category}
                onChange={setCategory}
                categories={allCategories}
                placeholder="Select or create…"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                {['oz', 'ml', 'l', 'bottle', 'case', 'keg', 'halfkeg', 'quarterkeg', 'sixthkeg', 'pint'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Qty on Hand</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={item.quantity_on_hand?.toString() ?? '—'}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>
          {quantity !== '' && (
            <p className="text-[10px] text-slate-500">Saving a quantity records a manual stock adjustment for today.</p>
          )}
        </div>
        {err && <p className="text-red-400 text-[10px]">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors group">
      {/* Name + dot + edit button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-200 leading-snug">{item.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={openEdit}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 hover:text-amber-400 active:text-amber-300 transition-all text-sm leading-none p-1"
            title="Edit"
          >
            ✎
          </button>
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} title={
            status === 'fresh' ? 'Counted recently' :
            status === 'aging' ? 'Counted 8–30 days ago' :
            status === 'stale' ? 'Counted 30+ days ago' : 'Never counted'
          } />
        </div>
      </div>

      {/* Quantity + pack breakdown */}
      <div>
        <p className={`text-3xl font-bold tabular-nums leading-none ${qtyColor}`}>
          {item.quantity_on_hand !== null ? item.quantity_on_hand : '—'}
        </p>
        {item.pack_size && item.pack_size > 1 && item.quantity_on_hand !== null && item.quantity_on_hand > 0 ? (
          <div className="mt-1.5 space-y-1">
            <p className="text-xs text-slate-500">{item.unit}</p>
            <p className="text-xs font-medium text-amber-400/80 leading-snug">
              {formatPackBreakdown(item.quantity_on_hand, item.pack_size, item.package_type).split(' · ')[1]}
            </p>
          </div>
        ) : (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-500">{item.unit}</p>
            {item.package_type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/60 font-medium leading-tight">
                {item.package_type}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Last counted */}
      <p className="text-[11px] text-slate-600 mt-auto">
        {item.count_date
          ? `Counted ${daysAgo(item.count_date) === 0 ? 'today' : `${daysAgo(item.count_date)}d ago`}`
          : 'Never counted'}
      </p>
    </div>
  )
}
