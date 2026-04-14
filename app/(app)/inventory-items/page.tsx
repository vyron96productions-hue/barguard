'use client'

import { useEffect, useState } from 'react'
import CategoryCombobox from '@/components/CategoryCombobox'
import { PACKAGE_TYPE_OPTIONS, PACKAGE_TYPE_SIZES, type PackageType } from '@/lib/beer-packaging'
import { UNIT_LABELS, UNIT_TO_OZ, INVENTORY_BEVERAGE_UNITS, INVENTORY_FOOD_UNITS, INVENTORY_PAPER_UNITS, formatQty } from '@/lib/conversions'
import { PRESET_CATEGORIES } from '@/lib/categories'
import type { InventoryItem, Vendor } from '@/types'
import type { AiCategorizeSuggestion } from '@/app/api/inventory-items/ai-categorize/route'
import type { ExpectedOnHandItem } from '@/app/api/inventory/expected-on-hand/route'

const BEVERAGE_UNITS = INVENTORY_BEVERAGE_UNITS
const FOOD_UNITS = INVENTORY_FOOD_UNITS
const PAPER_UNITS = INVENTORY_PAPER_UNITS

type ItemType = 'beverage' | 'food' | 'paper'

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
  const [bulkPriceError, setBulkPriceError] = useState<string | null>(null)

  const [selectMode,     setSelectMode]     = useState(false)
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [bulkDeleting,   setBulkDeleting]   = useState(false)

  // AI auto-categorize
  const [aiCatMode,      setAiCatMode]      = useState(false)
  const [aiCatLoading,   setAiCatLoading]   = useState(false)
  const [aiCatSuggestions, setAiCatSuggestions] = useState<AiCategorizeSuggestion[]>([])
  const [aiCatApplying,  setAiCatApplying]  = useState(false)
  const [aiCatDone,      setAiCatDone]      = useState(false)
  const [aiCatError,     setAiCatError]     = useState<string | null>(null)
  const [aiCatSkipped,   setAiCatSkipped]   = useState<Set<string>>(new Set())

  const [collapsedCats,  setCollapsedCats]  = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Expected on hand (auto-calculated from sales + recipes since last count)
  const [expectedMap,    setExpectedMap]    = useState<Record<string, ExpectedOnHandItem>>({})

  // Set stock inline correction
  const [setStockItemId,  setSetStockItemId]  = useState<string | null>(null)
  const [setStockValue,   setSetStockValue]   = useState('')   // cases (for food+pack_size) or raw qty
  const [setStockLoose,   setSetStockLoose]   = useState('')   // loose units (food+pack_size only)
  const [setStockSaving,  setSetStockSaving]  = useState(false)

  async function fetchExpected() {
    const res = await fetch('/api/inventory/expected-on-hand')
    if (!res.ok) return
    const data: ExpectedOnHandItem[] = await res.json()
    const map: Record<string, ExpectedOnHandItem> = {}
    for (const e of data) map[e.id] = e
    setExpectedMap(map)
  }

  async function handleSetStock(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    const isFCP = item?.item_type === 'food' &&
      (item.unit === 'lb' || item.unit === 'oz' || item.unit === 'each' || item.unit === 'gallon' || item.unit === 'quart') &&
      (item.pack_size ?? 0) > 1
    let qty: number
    if (isFCP && item?.pack_size) {
      const c = parseInt(setStockValue || '0') || 0
      const l = parseFloat(setStockLoose || '0') || 0
      qty = c * item.pack_size + l
    } else {
      qty = parseFloat(setStockValue)
    }
    if (isNaN(qty) || qty < 0) return
    setSetStockSaving(true)
    try {
      await fetch('/api/inventory-counts/set-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_item_id: itemId, quantity_on_hand: qty }),
      })
      setSetStockItemId(null)
      setSetStockValue('')
      setSetStockLoose('')
      fetchExpected()
    } finally {
      setSetStockSaving(false)
    }
  }

  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editName,       setEditName]       = useState('')
  const [editUnit,       setEditUnit]       = useState('')
  const [editCat,        setEditCat]        = useState('')
  const [editCost,       setEditCost]       = useState('')
  const [editReorderLevel, setEditReorderLevel] = useState('')
  const [editVendorId,   setEditVendorId]   = useState('')
  const [editItemType,   setEditItemType]   = useState<ItemType>('beverage')
  const [editPackageType, setEditPackageType] = useState('')
  const [editPackSize,   setEditPackSize]   = useState('')
  const [editSaving,     setEditSaving]     = useState(false)
  const [editError,      setEditError]      = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/inventory-items').then((r) => r.json()),
      fetch('/api/vendors').then((r) => r.json()),
    ]).then(([itemsData, vendorsData]) => {
      setItems(Array.isArray(itemsData) ? itemsData : [])
      setVendors(Array.isArray(vendorsData) ? vendorsData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetchExpected()
  }, [])

  async function fetchItems() {
    const res = await fetch('/api/inventory-items')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
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
        pack_size: packSize ? parseFloat(packSize) : null,
        // Food weight units with pack_size: user enters cost-per-case → convert to cost-per-unit
        cost_per_unit: costPerUnit
          ? (itemType === 'food' && (unit === 'lb' || unit === 'oz' || unit === 'each' || unit === 'gallon' || unit === 'quart') && packSize && parseFloat(packSize) > 0
              ? parseFloat(costPerUnit) / parseFloat(packSize)
              : parseFloat(costPerUnit))
          : null,
        reorder_level: reorderLevel ? (() => {
          const raw = parseFloat(reorderLevel)
          const isVol = unit === 'gallon' || unit === 'quart'
          return isVol ? raw / (UNIT_TO_OZ[unit] ?? 1) : raw
        })() : null,
        vendor_id: vendorId || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setCategory(''); setPackageType(''); setPackSize(''); setCostPerUnit(''); setReorderLevel(''); setVendorId('')
    setItemType(typeFilter === 'food' ? 'food' : typeFilter === 'paper' ? 'paper' : 'beverage')
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

  function toggleSelectMode() {
    setSelectMode((prev) => { if (prev) setSelectedIds(new Set()); return !prev })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    await Promise.all([...selectedIds].map((id) => fetch(`/api/inventory-items?id=${id}`, { method: 'DELETE' })))
    setSelectedIds(new Set())
    setSelectMode(false)
    setBulkDeleting(false)
    fetchItems()
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditUnit(item.unit)
    setEditCat(item.category ?? '')
    // Food weight units (lb, oz) with pack_size: cost stored as per-unit → display as per-case
    const packSz = item.pack_size
    const isFoodWeightCase = (item.item_type === 'food') && (item.unit === 'lb' || item.unit === 'oz' || item.unit === 'each' || item.unit === 'gallon' || item.unit === 'quart') && packSz != null && packSz > 0
    setEditCost(item.cost_per_unit != null
      ? String(isFoodWeightCase ? parseFloat((item.cost_per_unit * packSz!).toFixed(4)) : item.cost_per_unit)
      : '')
    const isVolUnit = item.unit === 'gallon' || item.unit === 'quart'
    setEditReorderLevel(item.reorder_level != null
      ? String(isVolUnit ? Math.round(item.reorder_level * (UNIT_TO_OZ[item.unit] ?? 1)) : item.reorder_level)
      : '')
    setEditVendorId(item.vendor_id ?? '')
    setEditItemType((item.item_type as ItemType) ?? 'beverage')
    setEditPackageType(item.package_type ?? '')
    setEditPackSize(item.pack_size != null ? String(item.pack_size) : '')
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
        item_type: editItemType,
        // Food/lb with lbs_per_case: user enters cost-per-case → convert to cost-per-lb
        cost_per_unit: editCost !== ''
          ? (editItemType === 'food' && (editUnit === 'lb' || editUnit === 'oz' || editUnit === 'each' || editUnit === 'gallon' || editUnit === 'quart') && editPackSize !== '' && parseFloat(editPackSize) > 0
              ? parseFloat(editCost) / parseFloat(editPackSize)
              : parseFloat(editCost))
          : null,
        reorder_level: editReorderLevel !== '' ? (() => {
          const raw = parseFloat(editReorderLevel)
          const isVol = editUnit === 'gallon' || editUnit === 'quart'
          return isVol ? raw / (UNIT_TO_OZ[editUnit] ?? 1) : raw
        })() : null,
        vendor_id: editVendorId || null,
        package_type: editPackageType || null,
        pack_size: editPackSize !== '' ? parseFloat(editPackSize) : null,
      }),
    })
    const data = await res.json()
    setEditSaving(false)
    if (!res.ok) { setEditError(data.error ?? 'Save failed'); return }
    setEditingId(null)
    fetchItems()
    fetchExpected()
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
    setBulkPriceError(null)
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
    } else {
      const d = await res.json().catch(() => ({}))
      setBulkPriceError(d?.error ?? 'Failed to save prices — please try again')
    }
  }

  async function openAiCategorize() {
    setAiCatMode(true)
    setAiCatLoading(true)
    setAiCatError(null)
    setAiCatDone(false)
    setAiCatSkipped(new Set())
    setAiCatSuggestions([])
    try {
      const res = await fetch('/api/inventory-items/ai-categorize')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch suggestions')
      setAiCatSuggestions(Array.isArray(data) ? data : [])
    } catch (e) {
      setAiCatError(e instanceof Error ? e.message : 'Error')
    }
    setAiCatLoading(false)
  }

  async function applyAiCategories() {
    const updates = aiCatSuggestions
      .filter((s) => !aiCatSkipped.has(s.id))
      .map((s) => ({ id: s.id, category: s.suggested_category }))
    if (updates.length === 0) { setAiCatMode(false); return }
    setAiCatApplying(true)
    const res = await fetch('/api/inventory-items/bulk-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    setAiCatApplying(false)
    if (res.ok) {
      setAiCatDone(true)
      await fetchItems()
      setTimeout(() => { setAiCatMode(false); setAiCatDone(false) }, 1400)
    } else {
      const d = await res.json().catch(() => ({}))
      setAiCatError(d?.error ?? 'Failed to apply categories')
    }
  }

  function handlePackageTypeChange(pt: string) {
    setPackageType(pt)
    if (pt && pt in PACKAGE_TYPE_SIZES) {
      setPackSize(String(PACKAGE_TYPE_SIZES[pt as PackageType]))
    }
  }

  const typeFilteredItems = typeFilter === 'all' ? items : items.filter((i) => (i.item_type ?? 'beverage') === typeFilter)
  const filteredItems = categoryFilter === 'all'
    ? typeFilteredItems
    : typeFilteredItems.filter((i) => (i.category ?? 'Uncategorized') === categoryFilter)

  // Categories present in the type-filtered set (for the category strip)
  const availableCategories = ['all', ...Array.from(
    new Set(typeFilteredItems.map((i) => i.category ?? 'Uncategorized'))
  ).sort()]

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

  const beverageItems = typeFilteredItems.filter(i => (i.item_type ?? 'beverage') === 'beverage')
  const foodItems = typeFilteredItems.filter(i => i.item_type === 'food')
  const paperItems = typeFilteredItems.filter(i => i.item_type === 'paper')
  const typesWithItems = [beverageItems, foodItems, paperItems].filter(g => g.length > 0).length
  const showTypeSections = typeFilter === 'all' && categoryFilter === 'all' && typesWithItems > 1

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  function renderCategoryGroups(list: InventoryItem[]) {
    const grouped = groupByCategory(list)
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => {
      const collapsed = collapsedCats.has(cat)
      return (
      <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCat(cat)}
          className="w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{cat}</h3>
            <span className="text-[10px] text-slate-700">{catItems.length}</span>
          </div>
          <span className={`text-slate-600 text-xs transition-transform ${collapsed ? '-rotate-90' : ''}`}>▾</span>
        </button>
        {!collapsed && (
        <div className="divide-y divide-slate-800/50">
          {catItems.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="px-4 sm:px-5 py-4 bg-slate-800/40 space-y-3">
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Edit Item</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">Type</label>
                      <div className="mt-1 flex rounded-lg overflow-hidden border border-slate-700 text-xs font-semibold">
                        {(['beverage', 'food', 'paper'] as ItemType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setEditItemType(t)
                              setEditUnit(t === 'beverage' ? 'bottle' : t === 'food' ? 'lb' : 'each')
                              setEditPackageType(''); setEditPackSize('')
                            }}
                            className={`flex-1 py-2 transition-colors ${editItemType === t ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                          >
                            {t === 'beverage' ? 'Beverage' : t === 'food' ? 'Food' : 'Paper'}
                          </button>
                        ))}
                      </div>
                    </div>
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
                        {(editItemType === 'beverage' ? BEVERAGE_UNITS : editItemType === 'paper' ? PAPER_UNITS : FOOD_UNITS).map((u) => (
                          <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>
                        ))}
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
                        {editItemType === 'food' && (editUnit === 'lb' || editUnit === 'oz' || editUnit === 'each' || editUnit === 'gallon' || editUnit === 'quart') && editPackSize && parseFloat(editPackSize) > 0
                          ? <>Cost per case / bag <span className="text-slate-700">(optional)</span></>
                          : <>Cost per {editUnit} <span className="text-slate-700">(optional)</span></>
                        }
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          placeholder="e.g. 17.49"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                      {editItemType === 'food' && (editUnit === 'lb' || editUnit === 'oz' || editUnit === 'each' || editUnit === 'gallon' || editUnit === 'quart') && editPackSize && parseFloat(editPackSize) > 0 && editCost && parseFloat(editCost) > 0 && (
                        <p className="text-[10px] text-emerald-400/50 mt-1">
                          = ${(parseFloat(editCost) / parseFloat(editPackSize)).toFixed(2)}/{editUnit} stored internally
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Reorder at{' '}
                        <span className="text-slate-700">
                          ({(editUnit === 'gallon' || editUnit === 'quart') ? 'oz' : editUnit})
                        </span>
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
                    {/* Weight/case field — food lb or oz; package type — beverage only */}
                    {editItemType === 'food' && (editUnit === 'lb' || editUnit === 'oz' || editUnit === 'each' || editUnit === 'gallon' || editUnit === 'quart') ? (
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {editUnit === 'oz' ? 'Oz per case / bag'
                            : editUnit === 'each' ? 'Count per case / pack'
                            : editUnit === 'gallon' ? 'Gallons per case'
                            : editUnit === 'quart' ? 'Quarts per case'
                            : 'Lbs per case / bag'}{' '}
                          <span className="text-slate-700">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editPackSize}
                          onChange={(e) => setEditPackSize(e.target.value)}
                          placeholder={editUnit === 'oz' ? 'e.g. 80' : editUnit === 'each' ? 'e.g. 48' : editUnit === 'gallon' ? 'e.g. 4' : editUnit === 'quart' ? 'e.g. 4' : 'e.g. 25'}
                          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    ) : editItemType === 'beverage' ? (
                      <>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Package type</label>
                          <select value={editPackageType} onChange={(e) => {
                            setEditPackageType(e.target.value)
                            if (e.target.value && e.target.value in PACKAGE_TYPE_SIZES) {
                              setEditPackSize(String(PACKAGE_TYPE_SIZES[e.target.value as PackageType]))
                            }
                          }}
                            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60">
                            <option value="">None</option>
                            {PACKAGE_TYPE_OPTIONS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Units/pack</label>
                          <input type="number" min="1" value={editPackSize} onChange={(e) => setEditPackSize(e.target.value)}
                            placeholder="e.g. 6"
                            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60" />
                        </div>
                      </>
                    ) : null}
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
                <div
                  className={`flex items-center justify-between px-4 sm:px-5 py-3 transition-colors ${
                    selectMode
                      ? selectedIds.has(item.id)
                        ? 'bg-amber-500/10 cursor-pointer'
                        : 'hover:bg-slate-800/30 cursor-pointer'
                      : 'hover:bg-slate-800/20'
                  }`}
                  onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                >
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-3 shrink-0 w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  )}
                  <div className="flex items-center gap-2 min-w-0 flex-wrap flex-1">
                    <p className="font-medium text-sm text-slate-200 truncate">{item.name}</p>
                    <span className="text-xs text-slate-500 shrink-0 bg-slate-800 px-2 py-0.5 rounded">{item.unit}</span>
                    {item.package_type && (
                      <span className="text-xs text-amber-500/70 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {item.package_type}
                      </span>
                    )}
                    {item.pack_size && !item.package_type && (
                      <span className="text-xs text-amber-500/70 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {item.item_type === 'food' && item.unit === 'lb'     ? `${item.pack_size} lb/case`
                          : item.item_type === 'food' && item.unit === 'oz'     ? `${item.pack_size} oz/case`
                          : item.item_type === 'food' && item.unit === 'each'   ? `${item.pack_size} ct/case`
                          : item.item_type === 'food' && item.unit === 'gallon' ? `${item.pack_size} gal/case`
                          : item.item_type === 'food' && item.unit === 'quart'  ? `${item.pack_size} qt/case`
                          : `${item.pack_size}/pack`}
                      </span>
                    )}
                    {item.cost_per_unit != null && (() => {
                      const isFoodCase = item.item_type === 'food' && (item.unit === 'lb' || item.unit === 'oz' || item.unit === 'each' || item.unit === 'gallon' || item.unit === 'quart') && item.pack_size && item.pack_size > 0
                      const displayCost = isFoodCase
                        ? (item.cost_per_unit * item.pack_size!).toFixed(2)
                        : item.cost_per_unit.toFixed(2)
                      const displayUnit = isFoodCase ? 'case' : item.unit
                      return (
                        <span className="text-xs text-emerald-500/70 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          ${displayCost}/{displayUnit}
                        </span>
                      )
                    })()}
                    {item.reorder_level != null && (() => {
                      const isVol = item.unit === 'gallon' || item.unit === 'quart'
                      const dispVal = isVol
                        ? Math.round(item.reorder_level * (UNIT_TO_OZ[item.unit] ?? 1))
                        : item.reorder_level
                      const dispUnit = isVol ? 'oz' : item.unit
                      return (
                        <span className="text-xs text-amber-500/60 shrink-0 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded">
                          reorder @ {dispVal} {dispUnit}
                        </span>
                      )
                    })()}
                    {item.vendor_id && vendors.find((v) => v.id === item.vendor_id) && (
                      <span className="text-xs text-indigo-400/70 shrink-0 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {vendors.find((v) => v.id === item.vendor_id)!.name}
                      </span>
                    )}
                    {expectedMap[item.id] && (() => {
                      const exp = expectedMap[item.id]
                      const u = item.unit
                      const factor = UNIT_TO_OZ[u] ?? 1
                      const expectedNative = exp.expected_qty_oz / factor
                      const purchasedNative = (exp.purchases_since_oz / factor).toFixed(1).replace(/\.0$/, '')
                      const deductedNative  = (exp.deductions_since_oz / factor).toFixed(1).replace(/\.0$/, '')
                      const isFCP = item.item_type === 'food' &&
                        (u === 'lb' || u === 'oz' || u === 'each' || u === 'gallon' || u === 'quart') &&
                        (item.pack_size ?? 0) > 1
                      const expRaw = Math.max(0, expectedNative)
                      const expCases = isFCP && item.pack_size ? Math.floor(expRaw / item.pack_size) : null
                      const expLoose = isFCP && item.pack_size ? Math.round((expRaw % item.pack_size) * 100) / 100 : null
                      const looseLabel = u === 'each' ? 'loose' : `${u} loose`

                      // Badge text: "~2 cases + 5 lb loose" or "~0 cases + 1 lb loose" etc.
                      const badgeText = isFCP
                        ? expCases === 0
                          ? `~${expLoose} ${looseLabel}`
                          : expLoose === 0
                            ? `~${expCases} case${expCases !== 1 ? 's' : ''}`
                            : `~${expCases} case${expCases !== 1 ? 's' : ''} + ${expLoose} ${looseLabel}`
                        : `~${formatQty(expRaw, u)} ${u} expected`

                      return setStockItemId === item.id ? (
                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          {isFCP ? (
                            <>
                              <input
                                type="number" min="0" step="1" autoFocus
                                value={setStockValue}
                                onChange={(e) => setSetStockValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSetStock(item.id); if (e.key === 'Escape') { setSetStockItemId(null); setSetStockValue(''); setSetStockLoose('') } }}
                                placeholder="cases"
                                className="w-16 bg-slate-800 border border-amber-500/40 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500">c +</span>
                              <input
                                type="number" min="0" step="any"
                                value={setStockLoose}
                                onChange={(e) => setSetStockLoose(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSetStock(item.id); if (e.key === 'Escape') { setSetStockItemId(null); setSetStockValue(''); setSetStockLoose('') } }}
                                placeholder={looseLabel}
                                className="w-20 bg-slate-800 border border-amber-500/40 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none"
                              />
                            </>
                          ) : (
                            <input
                              type="number" min="0" step="any" autoFocus
                              value={setStockValue}
                              onChange={(e) => setSetStockValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetStock(item.id); if (e.key === 'Escape') { setSetStockItemId(null); setSetStockValue('') } }}
                              placeholder={`qty in ${u}`}
                              className="w-28 bg-slate-800 border border-amber-500/40 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none"
                            />
                          )}
                          <button onClick={() => handleSetStock(item.id)} disabled={setStockSaving}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-2 py-0.5 rounded disabled:opacity-40"
                          >{setStockSaving ? '…' : 'Set'}</button>
                          <button onClick={() => { setSetStockItemId(null); setSetStockValue(''); setSetStockLoose('') }}
                            className="text-xs text-slate-500 hover:text-slate-300 px-1"
                          >✕</button>
                        </div>
                      ) : (
                        <button
                          title={`Expected on hand as of today.\nLast count: ${exp.last_count_qty} ${u} on ${exp.last_count_date}\n+ ${purchasedNative} ${u} purchased\n− ${deductedNative} ${u} used\n\nClick to correct this value`}
                          onClick={() => {
                            setSetStockItemId(item.id)
                            if (isFCP && item.pack_size) {
                              setSetStockValue(String(expCases ?? 0))
                              setSetStockLoose(String(expLoose ?? 0))
                            } else {
                              setSetStockValue(String(Math.max(0, parseFloat(expRaw.toFixed(2)))))
                            }
                          }}
                          className="text-xs text-sky-400/80 shrink-0 bg-sky-500/10 border border-sky-500/20 hover:border-sky-400/50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {badgeText}
                        </button>
                      )
                    })()}
                  </div>
                  {!selectMode && (
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
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    )})
  }

  return (
    <div className={`space-y-5 max-w-2xl ${selectMode ? 'pb-24' : ''}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Inventory Items</h1>
          <p className="text-slate-500 mt-1 text-sm">Physical items you track — bottles, kegs, ingredients, food stock.</p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={toggleSelectMode}
              className={`shrink-0 px-4 py-2 border text-sm font-semibold rounded-lg transition-colors ${
                selectMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
            {!selectMode && (
              <>
                <button
                  onClick={openBulkPriceMode}
                  className="shrink-0 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Edit Prices
                </button>
                {items.some((i) => !i.category) && (
                  <button
                    onClick={openAiCategorize}
                    className="shrink-0 px-4 py-2 bg-slate-800 border border-amber-500/30 text-amber-400 text-sm font-semibold rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    Auto Categorize
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-200 text-sm">Add Item</h2>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
            {(['beverage', 'food', 'paper'] as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setItemType(t)
                  setUnit(t === 'beverage' ? 'bottle' : t === 'food' ? 'lb' : 'each')
                  setPackageType(''); setPackSize('')
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  itemType === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'paper' ? 'Paper' : t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={itemType === 'food' ? 'Item name (e.g. Burger Patty, Lettuce)' : itemType === 'paper' ? 'Item name (e.g. 12oz Cups, Napkins, To-Go Boxes)' : "Item name (e.g. Corona Extra, Tito's Vodka)"}
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
                {(itemType === 'beverage' ? BEVERAGE_UNITS : itemType === 'paper' ? PAPER_UNITS : FOOD_UNITS).map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>
                ))}
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

          {/* Weight/case — food items with lb or oz unit */}
          {itemType === 'food' && (unit === 'lb' || unit === 'oz' || unit === 'each' || unit === 'gallon' || unit === 'quart') && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {unit === 'oz' ? 'Oz per case / bag' : unit === 'each' ? 'Count per case / pack' : 'Lbs per case / bag'}{' '}
                <span className="text-slate-700">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder={unit === 'oz' ? 'e.g. 80' : unit === 'each' ? 'e.g. 48' : 'e.g. 25'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
              {packSize && (
                <p className="text-[10px] text-slate-600 mt-1">
                  Purchase scans will auto-convert cases × {packSize} {unit} = total {unit}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {itemType === 'food' && (unit === 'lb' || unit === 'oz' || unit === 'each' || unit === 'gallon' || unit === 'quart') && packSize && parseFloat(packSize) > 0
                  ? <>Cost per case / bag <span className="text-slate-700">(optional)</span></>
                  : <>Cost per {unit || 'unit'} <span className="text-slate-700">(optional)</span></>
                }
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="e.g. 17.49"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              {itemType === 'food' && (unit === 'lb' || unit === 'oz' || unit === 'each' || unit === 'gallon' || unit === 'quart') && packSize && parseFloat(packSize) > 0 && costPerUnit && parseFloat(costPerUnit) > 0 && (
                <p className="text-[10px] text-emerald-400/50 mt-1">
                  = ${(parseFloat(costPerUnit) / parseFloat(packSize)).toFixed(2)}/{unit} stored internally
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Reorder at <span className="text-slate-700">({unit}, optional)</span>
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

      {/* Type filter + Category filter */}
      {items.length > 0 && (
        <div className="space-y-2">
          {/* Type strip */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
            {(['all', 'beverage', 'food', 'paper'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setCategoryFilter('all') }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all'
                  ? `All (${items.length})`
                  : t === 'beverage'
                    ? `Beverages (${beverageItems.length})`
                    : t === 'food'
                      ? `Food (${foodItems.length})`
                      : `Paper (${paperItems.length})`}
              </button>
            ))}
          </div>

          {/* Category strip — only when there are 2+ categories */}
          {availableCategories.length > 2 && (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-0.5">
              <div className="flex items-center gap-1 min-w-max">
                {availableCategories.map((cat) => {
                  const count = cat === 'all'
                    ? typeFilteredItems.length
                    : typeFilteredItems.filter((i) => (i.category ?? 'Uncategorized') === cat).length
                  const active = categoryFilter === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                        active
                          ? 'bg-slate-700 border-slate-600 text-slate-100'
                          : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                      <span className={`ml-1.5 ${active ? 'text-slate-400' : 'text-slate-700'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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
              <div className="flex flex-col gap-0.5">
              <p className="text-xs text-slate-500">
                {(() => {
                  const changed = items.filter((i) => (priceEdits[i.id] ?? '') !== (i.cost_per_unit != null ? String(i.cost_per_unit) : '')).length
                  return changed > 0 ? `${changed} item${changed !== 1 ? 's' : ''} changed` : 'No changes yet'
                })()}
              </p>
              {bulkPriceError && <p className="text-xs text-red-400">{bulkPriceError}</p>}
              </div>
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

      {/* AI Auto Categorize overlay */}
      {aiCatMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="border-b border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Auto Categorize</h2>
              <p className="text-xs text-slate-500 mt-0.5">AI-suggested categories for uncategorized items. Deselect any you want to skip.</p>
            </div>
            <button onClick={() => setAiCatMode(false)} className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1">✕</button>
          </div>

          {aiCatDone ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-4xl">✓</p>
              <p className="text-lg font-semibold text-emerald-400">Categories applied!</p>
            </div>
          ) : aiCatLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-slate-400 text-sm animate-pulse">Analyzing your items…</p>
            </div>
          ) : aiCatError && aiCatSuggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-red-400 text-sm">{aiCatError}</p>
              <button onClick={() => setAiCatMode(false)} className="text-slate-400 text-sm hover:text-slate-200">Close</button>
            </div>
          ) : aiCatSuggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-slate-500 text-sm">All items already have a category.</p>
              <button onClick={() => setAiCatMode(false)} className="text-slate-400 text-sm hover:text-slate-200">Close</button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-4 py-2 hidden sm:grid grid-cols-[1fr_180px_60px] gap-4">
                  {['Item', 'Suggested Category', ''].map((h) => (
                    <p key={h} className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">{h}</p>
                  ))}
                </div>
                <div className="divide-y divide-slate-800/60">
                  {aiCatSuggestions.map((s) => {
                    const skipped = aiCatSkipped.has(s.id)
                    return (
                      <div key={s.id} className={`px-4 py-3 flex items-center gap-4 transition-colors ${skipped ? 'opacity-40' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{s.name}</p>
                          <p className="text-xs text-slate-600 sm:hidden mt-0.5">{s.suggested_category}</p>
                        </div>
                        <p className="hidden sm:block w-[180px] text-xs text-amber-400 font-medium">{s.suggested_category}</p>
                        <button
                          onClick={() => setAiCatSkipped((prev) => {
                            const next = new Set(prev)
                            if (next.has(s.id)) next.delete(s.id); else next.add(s.id)
                            return next
                          })}
                          className={`shrink-0 text-xs px-2 py-1 rounded transition-colors ${skipped ? 'text-amber-400 hover:text-slate-400' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {skipped ? 'undo' : 'skip'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="border-t border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-950/95 backdrop-blur">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-slate-500">
                    {aiCatSuggestions.length - aiCatSkipped.size} of {aiCatSuggestions.length} will be updated
                  </p>
                  {aiCatError && <p className="text-xs text-red-400">{aiCatError}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAiCatMode(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={applyAiCategories}
                    disabled={aiCatApplying || aiCatSuggestions.length === aiCatSkipped.size}
                    className="px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {aiCatApplying ? 'Applying…' : 'Apply Categories'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bulk select action bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={selectedIds.size === filteredItems.length ? deselectAll : selectAll}
                className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
              <p className="text-sm text-slate-400">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'None selected'}
              </p>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || bulkDeleting}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {bulkDeleting ? 'Deleting…' : `Delete${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
            </button>
          </div>
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
          {beverageItems.length > 0 && (
            <div className="space-y-3">
              <SectionDivider label="Beverages" count={beverageItems.length} />
              {renderCategoryGroups(beverageItems)}
            </div>
          )}
          {foodItems.length > 0 && (
            <div className="space-y-3">
              <SectionDivider label="Food & Kitchen" count={foodItems.length} />
              {renderCategoryGroups(foodItems)}
            </div>
          )}
          {paperItems.length > 0 && (
            <div className="space-y-3">
              <SectionDivider label="Paper & Supplies" count={paperItems.length} />
              {renderCategoryGroups(paperItems)}
            </div>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-sm">No items in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {renderCategoryGroups(filteredItems)}
        </div>
      )}
    </div>
  )
}
