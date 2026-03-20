'use client'

import { useEffect, useState } from 'react'
import CategoryCombobox from '@/components/CategoryCombobox'
import { PACKAGE_TYPE_OPTIONS, PACKAGE_TYPE_SIZES, type PackageType } from '@/lib/beer-packaging'
import { UNIT_LABELS } from '@/lib/conversions'
import type { InventoryItem, Vendor } from '@/types'

const BEVERAGE_UNITS = ['bottle', '1L', '1.75L', 'can', 'beer_bottle', 'pint', 'case', 'keg', 'halfkeg', 'quarterkeg', 'sixthkeg']
const FOOD_UNITS = ['each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'bag', 'tray', 'box', 'jar', 'packet', 'flat']

type ItemType = 'beverage' | 'food'

const BEVERAGE_CATEGORIES = [
  'spirits', 'beer', 'wine', 'keg',
  'mixer', 'non-alcoholic', 'supply',
  'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac',
]
const FOOD_CATEGORIES = [
  'proteins', 'produce', 'dairy', 'dry goods', 'frozen',
  'sauces', 'garnish', 'bread & starches', 'prep items', 'disposables',
]
const PRESET_CATEGORIES = [...BEVERAGE_CATEGORIES, ...FOOD_CATEGORIES, 'other']

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] shrink-0">{label}</p>
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-[10px] text-slate-700 shrink-0">{count}</span>
    </div>
  )
}

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('bottle')
  const [category, setCategory] = useState('')
  const [itemType, setItemType] = useState<ItemType>('beverage')
  const [packageType, setPackageType] = useState('')
  const [packSize, setPackSize] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoLinked, setAutoLinked] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all')
  // Bulk price editor
  const [bulkPriceMode, setBulkPriceMode]   = useState(false)
  const [priceEdits, setPriceEdits]         = useState<Record<string, string>>({})
  const [bulkPriceSaving, setBulkPriceSaving] = useState(false)
  const [bulkPriceDone, setBulkPriceDone]   = useState(false)

  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editName,       setEditName]       = useState('')
  const [editUnit,       setEditUnit]       = useState('')
  const [editCat,        setEditCat]        = useState('')
  const [editCost,       setEditCost]       = useState('')
  const [editReorderLevel, setEditReorderLevel] = useState('')
  const [editVendorId,   setEditVendorId]   = useState('')
  const [editSaving,     setEditSaving]     = useState(false)
  const [editError,      setEditError]      = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
    fetchVendors()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const res = await fetch('/api/inventory-items')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchVendors() {
    const res = await fetch('/api/vendors')
    const data = await res.json()
    setVendors(Array.isArray(data) ? data : [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/inventory-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        unit,
        category,
        item_type: itemType,
        package_type: packageType || null,
        pack_size: packSize || null,
        cost_per_unit: costPerUnit || null,
        reorder_level: reorderLevel || null,
        vendor_id: vendorId || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setCategory(''); setPackageType(''); setPackSize(''); setCostPerUnit(''); setReorderLevel(''); setVendorId(''); setItemType('beverage')
    if (data.auto_menu_item) {
      setAutoLinked(data.auto_menu_item)
      setTimeout(() => setAutoLinked(null), 5000)
    }
    fetchItems()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item? This will also remove its count history and unlink it from past purchases.')) return
    const res = await fetch(`/api/inventory-items?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete item')
      return
    }
    fetchItems()
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditUnit(item.unit)
    setEditCat(item.category ?? '')
    setEditCost(item.cost_per_unit != null ? String(item.cost_per_unit) : '')
    setEditReorderLevel(item.reorder_level != null ? String(item.reorder_level) : '')
    setEditVendorId(item.vendor_id ?? '')
    setEditError(null)
  }

  async function saveEdit() {
    if (!editingId) return
    setEditSaving(true)
    setEditError(null)
    const res = await fetch('/api/inventory-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        name: editName,
        unit: editUnit,
        category: editCat || null,
        cost_per_unit: editCost !== '' ? editCost : null,
        reorder_level: editReorderLevel !== '' ? editReorderLevel : null,
        vendor_id: editVendorId || null,
      }),
    })
    const data = await res.json()
    setEditSaving(false)
    if (!res.ok) { setEditError(data.error ?? 'Save failed'); return }
    setEditingId(null)
    fetchItems()
  }

  function openBulkPriceMode() {
    const initial: Record<string, string> = {}
    items.forEach((item) => {
      initial[item.id] = item.cost_per_unit != null ? String(item.cost_per_unit) : ''
    })
    setPriceEdits(initial)
    setBulkPriceDone(false)
    setBulkPriceMode(true)
  }

  async function saveBulkPrices() {
    const updates = items
      .filter((item) => {
        const edited = priceEdits[item.id] ?? ''
        const original = item.cost_per_unit != null ? String(item.cost_per_unit) : ''
        return edited !== original
      })
      .map((item) => ({
        id: item.id,
        cost_per_unit: priceEdits[item.id] !== '' ? parseFloat(priceEdits[item.id]) : null,
      }))

    if (updates.length === 0) { setBulkPriceMode(false); return }

    setBulkPriceSaving(true)
    const res = await fetch('/api/inventory-items/bulk-prices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    setBulkPriceSaving(false)
    if (res.ok) {
      setBulkPriceDone(true)
      await fetchItems()
      setTimeout(() => { setBulkPriceMode(false); setBulkPriceDone(false) }, 1200)
    }
  }

  function handlePackageTypeChange(pt: string) {
    setPackageType(pt)
    if (pt && pt in PACKAGE_TYPE_SIZES) {
      setPackSize(String(PACKAGE_TYPE_SIZES[pt as PackageType]))
    }
  }

  const filteredItems = typeFilter === 'all' ? items : items.filter((i) => (i.item_type ?? 'beverage') === typeFilter)

  function groupByCategory(list: InventoryItem[]) {
    return list.reduce<Record<string, InventoryItem[]>>((acc, item) => {
      const cat = item.category ?? 'Uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }

  const allCategories = [...new Set([
    ...PRESET_CATEGORIES,
    ...items.map((i) => i.category).filter(Boolean) as string[],
  ])].sort()

  const beverageItems = items.filter(i => (i.item_type ?? 'beverage') === 'beverage')
  const foodItems = items.filter(i => i.item_type === 'food')
  const showTypeSections = typeFilter === 'all' && beverageItems.length > 0 && foodItems.length > 0

  function renderCategoryGroups(list: InventoryItem[]) {
    const grouped = groupByCategory(list)
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
      <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-800/40">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{cat}</h3>
        </div>
        <div className="divide-y divide-slate-800/50">
          {catItems.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="px-4 sm:px-5 py-4 bg-slate-800/40 space-y-3">
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Edit Item</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Unit</label>
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                      >
                        {BEVERAGE_UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Category</label>
                      <CategoryCombobox
                        value={editCat}
                        onChange={setEditCat}
                        categories={allCategories}
                        placeholder="Select or create…"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Cost per {UNIT_LABELS[editUnit] ?? editUnit} <span className="text-slate-700">(optional)</span>
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          placeholder="e.g. 24.99"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Reorder at <span className="text-slate-700">({UNIT_LABELS[editUnit] ?? editUnit}s)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editReorderLevel}
                        onChange={(e) => setEditReorderLevel(e.target.value)}
                        placeholder="e.g. 3"
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>
                    {vendors.length > 0 && (
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Vendor <span className="text-slate-700">(optional)</span></label>
                        <select
                          value={editVendorId}
                          onChange={(e) => setEditVendorId(e.target.value)}
                          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                        >
                          <option value="">None</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-xs disabled:opacity-50 transition-colors"
                    >
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <p className="font-medium text-sm text-slate-200 truncate">{item.name}</p>
                    <span className="text-xs text-slate-500 shrink-0 bg-slate-800 px-2 py-0.5 rounded">{UNIT_LABELS[item.unit] ?? item.unit}</span>
                    {item.package_type && (
                      <span className="text-xs text-amber-500/70 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {item.package_type}
                      </span>
                    )}
                    {item.pack_size && !item.package_type && (
                      <span className="text-xs text-amber-500/70 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {item.pack_size}/pack
                      </span>
                    )}
                    {item.cost_per_unit != null && (
                      <span className="text-xs text-emerald-500/70 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        ${item.cost_per_unit.toFixed(2)}/{UNIT_LABELS[item.unit] ?? item.unit}
                      </span>
                    )}
                    {item.reorder_level != null && (
                      <span className="text-xs text-amber-500/60 shrink-0 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded">
                        reorder @ {item.reorder_level}
                      </span>
                    )}
                    {item.vendor_id && vendors.find((v) => v.id === item.vendor_id) && (
                      <span className="text-xs text-indigo-400/70 shrink-0 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {vendors.find((v) => v.id === item.vendor_id)!.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs text-slate-500 hover:text-amber-400 transition-colors py-1 px-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-slate-700 hover:text-red-400 active:text-red-300 transition-colors py-1 px-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Inventory Items</h1>
          <p className="text-slate-500 mt-1 text-sm">Physical items you track — bottles, kegs, ingredients, food stock.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={openBulkPriceMode}
            className="shrink-0 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Edit Prices
          </button>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-200 text-sm">Add Item</h2>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
            {(['beverage', 'food'] as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setItemType(t)
                  setUnit(t === 'food' ? 'each' : 'bottle')
                  setPackageType(''); setPackSize('')
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  itemType === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={itemType === 'food' ? 'Item name (e.g. Burger Patty, Lettuce)' : "Item name (e.g. Corona Extra, Tito's Vodka)"}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <optgroup label={itemType === 'food' ? 'Food units' : 'Beverage units'}>
                  {(itemType === 'food' ? FOOD_UNITS : BEVERAGE_UNITS).map((u) => <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>)}
                </optgroup>
                <optgroup label="Other">
                  {(itemType === 'food' ? BEVERAGE_UNITS : FOOD_UNITS).map((u) => <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <CategoryCombobox
                value={category}
                onChange={setCategory}
                categories={allCategories}
                placeholder="Select or create…"
              />
            </div>
          </div>

          {/* Package type — beverages only */}
          {itemType === 'beverage' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Package type <span className="text-slate-700">(optional)</span></label>
                  <select
                    value={packageType}
                    onChange={(e) => handlePackageTypeChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="">None</option>
                    {PACKAGE_TYPE_OPTIONS.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Units per pack <span className="text-slate-700">(optional)</span></label>
                  <input
                    type="number"
                    min="1"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 6"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
              {(packageType || packSize) && (
                <p className="text-[10px] text-slate-600">
                  Stock counts will show pack breakdown. e.g. 30 cans · 5 × {packageType || `${packSize}-pack`}
                </p>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Cost per {unit || 'unit'} <span className="text-slate-700">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="e.g. 24.99"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Reorder at <span className="text-slate-700">({UNIT_LABELS[unit] ?? unit}s, optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="e.g. 3"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {vendors.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Vendor <span className="text-slate-700">(optional)</span></label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="">None</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Auto-link confirmation */}
      {autoLinked && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <span className="text-emerald-400 text-sm">✓</span>
          <p className="text-sm text-emerald-400 font-medium">
            <span className="font-bold">{autoLinked}</span> was also added to Recipe Mapping with a default recipe.
            <a href="/menu-items" className="ml-2 underline underline-offset-2 text-emerald-300 hover:text-emerald-200">View →</a>
          </p>
        </div>
      )}

      {/* Type filter */}
      {items.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
          {(['all', 'beverage', 'food'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all'
                ? `All (${items.length})`
                : t === 'beverage'
                  ? `Beverages (${beverageItems.length})`
                  : `Food (${foodItems.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Bulk Price Editor overlay */}
      {bulkPriceMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Edit Prices</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cost per unit — what you pay your supplier. Used for margin calculations.</p>
            </div>
            <button onClick={() => setBulkPriceMode(false)} className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1">✕</button>
          </div>

          {bulkPriceDone ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-4xl">✓</p>
              <p className="text-lg font-semibold text-emerald-400">Prices saved!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Column headers */}
              <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-4 py-2 hidden sm:grid grid-cols-[1fr_120px_100px_140px] gap-4">
                {['Item', 'Category', 'Unit', 'Cost Per Unit'].map((h) => (
                  <p key={h} className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-slate-800/60">
                {items.map((item) => {
                  const original = item.cost_per_unit != null ? String(item.cost_per_unit) : ''
                  const current = priceEdits[item.id] ?? ''
                  const isDirty = current !== original
                  return (
                    <div key={item.id} className={`px-4 py-3 flex items-center gap-4 transition-colors ${isDirty ? 'bg-amber-500/5' : ''}`}>
                      {/* Mobile layout */}
                      <div className="sm:hidden flex-1 space-y-1">
                        <p className="text-sm font-medium text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-600">{item.category ?? ''} · {UNIT_LABELS[item.unit] ?? item.unit}</p>
                      </div>
                      {/* Desktop layout */}
                      <p className="hidden sm:block flex-1 text-sm font-medium text-slate-200 min-w-0 truncate">{item.name}</p>
                      <p className="hidden sm:block w-[120px] text-xs text-slate-500 truncate">{item.category ?? '—'}</p>
                      <p className="hidden sm:block w-[100px] text-xs text-slate-500">{UNIT_LABELS[item.unit] ?? item.unit}</p>
                      <div className={`relative shrink-0 ${isDirty ? 'sm:w-[140px]' : 'sm:w-[140px]'}`}>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="—"
                          value={current}
                          onChange={(e) => setPriceEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className={`w-full bg-slate-900 border rounded-lg pl-7 pr-3 py-2 text-sm text-slate-200 focus:outline-none transition-colors ${
                            isDirty ? 'border-amber-500/60 focus:border-amber-500' : 'border-slate-700 focus:border-amber-500/60'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          {!bulkPriceDone && (
            <div className="border-t border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-950/95 backdrop-blur">
              <p className="text-xs text-slate-500">
                {(() => {
                  const changed = items.filter((i) => (priceEdits[i.id] ?? '') !== (i.cost_per_unit != null ? String(i.cost_per_unit) : '')).length
                  return changed > 0 ? `${changed} item${changed !== 1 ? 's' : ''} changed` : 'No changes yet'
                })()}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setBulkPriceMode(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveBulkPrices}
                  disabled={bulkPriceSaving}
                  className="px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {bulkPriceSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-3xl mb-3">◈</p>
          <p className="text-sm">No inventory items yet. Add your first item above.</p>
        </div>
      ) : showTypeSections ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <SectionDivider label="Beverages" count={beverageItems.length} />
            {renderCategoryGroups(beverageItems)}
          </div>
          <div className="space-y-3">
            <SectionDivider label="Food & Kitchen" count={foodItems.length} />
            {renderCategoryGroups(foodItems)}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {renderCategoryGroups(filteredItems)}
        </div>
      )}
    </div>
  )
}
