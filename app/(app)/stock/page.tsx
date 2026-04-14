'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import CategoryCombobox from '@/components/CategoryCombobox'
import { formatPackBreakdown } from '@/lib/beer-packaging'
import { UNIT_LABELS, formatQty, INVENTORY_BEVERAGE_UNITS, FOOD_UNITS as FOOD_UNITS_SET } from '@/lib/conversions'
import { BEVERAGE_CATEGORIES, FOOD_CATEGORIES, PAPER_CATEGORIES, PRESET_CATEGORIES } from '@/lib/categories'
import type { AiCategorizeSuggestion } from '@/app/api/inventory-items/ai-categorize/route'
import type { ExpectedOnHandItem } from '@/app/api/inventory/expected-on-hand/route'

const BEVERAGE_UNITS = INVENTORY_BEVERAGE_UNITS
const FOOD_UNITS_LIST = Array.from(FOOD_UNITS_SET)

// Bottle-type units and their oz size — used for partial bottle display
const BOTTLE_SIZE_OZ: Record<string, number> = {
  'bottle':      25.36,    // 750ml spirit bottle
  'wine_bottle': 25.36,    // 750ml wine bottle
  '750ml':       25.36,
  '1L':          33.814,
  '1.75L':       59.1745,
}
const STANDARD_SHOT_OZ = 1.5
const STANDARD_WINE_GLASS_OZ = 5.0
const WINE_UNITS = new Set(['wine_bottle'])

interface StockItem {
  id: string
  name: string
  unit: string
  category: string | null
  item_type: string | null
  pack_size: number | null
  package_type: string | null
  quantity_on_hand: number | null
  count_date: string | null
  estimated_qty: number | null
  has_estimate: boolean
}

interface AnalysisFinding {
  id: string
  name: string
  category: string | null
  expected: number
  actual: number
  unit: string
  gap: number
  gapPercent: number
  reasons: string[]
}

interface AnalysisResult {
  findings: AnalysisFinding[]
  summary: string | null
}

type FilterCategory = 'all' | string
type TypeFilter = 'all' | 'beverage' | 'food' | 'paper'

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

function isPaper(item: StockItem) {
  if (item.item_type === 'paper') return true
  const cat = item.category?.toLowerCase() ?? ''
  return PAPER_CATEGORIES.some((pc) => cat === pc.toLowerCase())
}

function isFood(item: StockItem) {
  if (isPaper(item)) return false
  if (item.item_type === 'food') return true
  // Category always wins — setting category to a food category overrides item_type
  const cat = item.category?.toLowerCase() ?? ''
  if (FOOD_CATEGORIES.some((fc) => cat === fc.toLowerCase())) return true
  // For items with no explicit type, fall back to unit
  if (!item.item_type || item.item_type === 'other') return FOOD_UNITS_SET.has(item.unit)
  return false
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [search, setSearch] = useState('')

  // Count mode
  const [countMode, setCountMode] = useState(false)
  const [countValues, setCountValues] = useState<Record<string, string>>({})
  const [countSearch, setCountSearch] = useState('')
  const [countTypeFilter, setCountTypeFilter] = useState<TypeFilter>('all')
  const [countSaving, setCountSaving] = useState(false)
  const [countDone, setCountDone] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // AI Categorize
  const [aiCatMode, setAiCatMode] = useState(false)
  const [aiCatRows, setAiCatRows] = useState<(AiCategorizeSuggestion & { selected: boolean; editCategory: string })[]>([])
  const [aiCatLoading, setAiCatLoading] = useState(false)
  const [aiCatSaving, setAiCatSaving] = useState(false)
  const [aiCatDone, setAiCatDone] = useState(false)
  const [aiCatError, setAiCatError] = useState('')
  const [aiCatInfo, setAiCatInfo] = useState('')

  // Expected on hand — fetched from sales × recipes since last physical count
  const [expectedMap, setExpectedMap] = useState<Record<string, ExpectedOnHandItem>>({})

  // Bottle scan
  const [scanTarget, setScanTarget] = useState<{ itemId: string; itemName: string; unit: string } | null>(null)

  const handleScanConfirm = useCallback((itemId: string, fraction: number) => {
    setCountValues((prev) => ({ ...prev, [itemId]: fraction.toFixed(2) }))
    setScanTarget(null)
  }, [])

  function reload() {
    fetch('/api/stock-levels')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
  }

  async function fetchExpected() {
    const res = await fetch('/api/inventory/expected-on-hand')
    if (!res.ok) return
    const data: ExpectedOnHandItem[] = await res.json()
    const map: Record<string, ExpectedOnHandItem> = {}
    for (const e of data) map[e.id] = e
    setExpectedMap(map)
  }

  useEffect(() => {
    fetch('/api/stock-levels')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
    fetchExpected()
  }, [])

  function openCountMode() {
    setCountValues({})
    setCountSearch('')
    setCountTypeFilter('all')
    setCountDone(false)
    setAnalyzing(false)
    setAnalysisResult(null)
    setCountMode(true)
    fetchExpected() // refresh so we have latest sales deductions
  }

  async function openAiCategorize() {
    setAiCatDone(false)
    setAiCatError('')
    setAiCatInfo('')
    setAiCatRows([])
    setAiCatMode(true)
    setAiCatLoading(true)
    try {
      const res = await fetch('/api/inventory-items/ai-categorize')
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        setAiCatError(data?.error ?? 'Failed to load suggestions')
        setAiCatLoading(false)
        return
      }
      if (data.length === 0) {
        setAiCatInfo('All items already have categories.')
        setAiCatLoading(false)
        return
      }
      setAiCatRows(data.map((s: AiCategorizeSuggestion) => ({ ...s, selected: true, editCategory: s.suggested_category })))
    } catch {
      setAiCatError('Network error')
    }
    setAiCatLoading(false)
  }

  async function saveAiCategories() {
    const updates = aiCatRows
      .filter((r) => r.selected && r.editCategory.trim())
      .map((r) => ({ id: r.id, category: r.editCategory.trim() }))
    if (updates.length === 0) return
    setAiCatSaving(true)
    try {
      const res = await fetch('/api/inventory-items/bulk-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) {
        const d = await res.json()
        setAiCatError(d?.error ?? 'Save failed')
        setAiCatSaving(false)
        return
      }
      setAiCatDone(true)
      reload()
    } catch {
      setAiCatError('Network error')
    }
    setAiCatSaving(false)
  }

  async function saveCount() {
    const counts = Object.entries(countValues)
      .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
      .map(([id, v]) => ({ id, quantity: parseFloat(v) }))
    if (counts.length === 0) return
    setCountSaving(true)
    await fetch('/api/inventory-counts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counts }),
    })
    setCountSaving(false)
    setCountDone(true)
    reload()

    // Run AI analysis on items that have an expected quantity
    const countsWithExpected = counts
      .map(({ id, quantity }) => {
        const item = items.find((i) => i.id === id)
        if (!item) return null
        const expected = item.has_estimate ? item.estimated_qty : item.quantity_on_hand
        if (expected === null || expected <= 0) return null
        return {
          id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          expected,
          actual: quantity,
        }
      })
      .filter(Boolean)

    if (countsWithExpected.length > 0) {
      setAnalyzing(true)
      try {
        const res = await fetch('/api/inventory-counts/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ counts: countsWithExpected }),
        })
        if (!res.ok) {
          setAnalysisResult({ findings: [], summary: 'Analysis failed — please try again.' })
        } else {
          const data = await res.json()
          setAnalysisResult(data)
        }
      } catch {
        setAnalysisResult({ findings: [], summary: 'Analysis failed — please try again.' })
      }
      setAnalyzing(false)
    } else {
      setAnalysisResult({ findings: [], summary: null })
    }
  }

  // Items with sales since their last physical count — need to be checked first
  const needsAttentionIds = new Set(
    items
      .filter((i) => (expectedMap[i.id]?.deductions_since_oz ?? 0) > 0)
      .map((i) => i.id)
  )
  const needsAttentionCount = needsAttentionIds.size

  const countFiltered = items
    .filter((i) => {
      if (countTypeFilter === 'beverage' && (isFood(i) || isPaper(i))) return false
      if (countTypeFilter === 'food' && !isFood(i)) return false
      if (countTypeFilter === 'paper' && !isPaper(i)) return false
      if (countSearch && !i.name.toLowerCase().includes(countSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      // Items sold since last count float to the top
      const aNeeds = needsAttentionIds.has(a.id) ? 0 : 1
      const bNeeds = needsAttentionIds.has(b.id) ? 0 : 1
      if (aNeeds !== bNeeds) return aNeeds - bNeeds
      return a.name.localeCompare(b.name)
    })

  const countEntered = Object.values(countValues).filter((v) => v !== '').length

  const beverageCount = items.filter((i) => !isFood(i) && !isPaper(i)).length
  const foodCount = items.filter(isFood).length
  const paperCount = items.filter(isPaper).length
  const typeCount = [beverageCount > 0, foodCount > 0, paperCount > 0].filter(Boolean).length
  const hasBoth = typeCount > 1

  const typeFiltered = items.filter((i) => {
    if (typeFilter === 'beverage') return !isFood(i) && !isPaper(i)
    if (typeFilter === 'food') return isFood(i)
    if (typeFilter === 'paper') return isPaper(i)
    return true
  })

  const categories = ['all', ...Array.from(new Set(typeFiltered.map((i) => i.category ?? 'Uncategorized'))).sort()]
  const allCategories = [...new Set([
    ...PRESET_CATEGORIES,
    ...items.map((i) => i.category).filter(Boolean) as string[],
  ])].sort()

  const visible = typeFiltered.filter((item) => {
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
  const uncategorizedCount = items.filter((i) => !i.category).length
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

  function renderSection(sectionItems: StockItem[], label?: string) {
    const sGrouped = sectionItems.reduce<Record<string, StockItem[]>>((acc, item) => {
      const cat = item.category ?? 'Uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
    return (
      <>
        {label && (
          <div className="flex items-center gap-3 mt-2 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-600">{sectionItems.length}</span>
          </div>
        )}
        {Object.entries(sGrouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
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
        ))}
      </>
    )
  }

  return (
    <>
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Current Stock Levels</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {countedCount} of {items.length} items counted
            {lastCountDate && ` · last count ${new Date(lastCountDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {uncategorizedCount > 0 && (
            <button
              onClick={openAiCategorize}
              className="text-xs px-3 py-2 rounded-lg bg-slate-800 border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/60 transition-colors font-medium"
            >
              ✦ AI Categorize ({uncategorizedCount})
            </button>
          )}
          <button
            onClick={openCountMode}
            className="relative text-sm px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 active:bg-amber-300 transition-colors"
          >
            Count Now
            {needsAttentionCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-300 text-slate-900 text-[10px] font-bold px-1">
                {needsAttentionCount}
              </span>
            )}
          </button>
          <a
            href="/uploads"
            className="text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Upload CSV
          </a>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Counted ≤7 days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Counted 8–30 days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Counted 30+ days ago</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" />Never counted</span>
      </div>

      {/* Type filter + Search + category filter */}
      <div className="space-y-3">
        {/* Type tab strip */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {([
            { key: 'all',      label: `All Items${hasBoth ? ` (${items.length})` : ''}` },
            { key: 'beverage', label: `Beverages${hasBoth ? ` (${beverageCount})` : ''}` },
            { key: 'food',     label: `Food${hasBoth ? ` (${foodCount})` : ''}` },
            { key: 'paper',    label: `Paper${hasBoth ? ` (${paperCount})` : ''}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTypeFilter(key); setFilter('all') }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                typeFilter === key ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === cat ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🍾</p>
          <p className="text-slate-300 font-medium">No inventory items yet</p>
          <p className="text-slate-500 text-sm mt-1">Add items in Inventory, then upload a count CSV.</p>
          <div className="flex gap-3 justify-center mt-4">
            <a href="/inventory-items" className="text-sm text-amber-400 hover:underline">Add Items →</a>
            <a href="/uploads" className="text-sm text-amber-400 hover:underline">Upload Count →</a>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">No items match your search.</p>
        </div>
      ) : typeFilter === 'all' && hasBoth && filter === 'all' && !search ? (
        // Sectioned view: Beverages, Food & Kitchen, Paper & Supplies
        <div className="space-y-5">
          {visible.filter((i) => !isFood(i) && !isPaper(i)).length > 0 && renderSection(visible.filter((i) => !isFood(i) && !isPaper(i)), 'Beverages')}
          {visible.filter(isFood).length > 0 && renderSection(visible.filter(isFood), 'Food & Kitchen')}
          {visible.filter(isPaper).length > 0 && renderSection(visible.filter(isPaper), 'Paper & Supplies')}
        </div>
      ) : (
        <div className="space-y-5">
          {renderSection(visible)}
        </div>
      )}
    </div>

    {/* ── Count Mode Overlay ── */}

    {scanTarget && (
      <BottleScanModal
        itemName={scanTarget.itemName}
        unit={scanTarget.unit}
        bottleSizeOz={BOTTLE_SIZE_OZ[scanTarget.unit] ?? 25.36}
        onConfirm={(fraction) => handleScanConfirm(scanTarget.itemId, fraction)}
        onClose={() => setScanTarget(null)}
      />
    )}

    {/* ── AI Categorize Overlay ── */}
    {aiCatMode && (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">AI Categorize Inventory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Review suggested categories. Edit any before saving.</p>
          </div>
          <button
            onClick={() => { setAiCatMode(false); setAiCatDone(false); setAiCatError(''); setAiCatInfo('') }}
            className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {aiCatLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-6 h-6 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Asking AI to categorize your items…</p>
            </div>
          ) : aiCatDone ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-3xl">✓</p>
              <p className="text-sm font-semibold text-emerald-400">Categories saved!</p>
              <p className="text-xs text-slate-500">Your inventory is now organized.</p>
            </div>
          ) : aiCatInfo ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
              <p className="text-3xl">✓</p>
              <p className="text-sm font-semibold text-emerald-400">{aiCatInfo}</p>
            </div>
          ) : aiCatError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
              <p className="text-sm text-red-400">{aiCatError}</p>
              <button
                onClick={() => setAiCatError('')}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <>
              {/* Select all */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={aiCatRows.every((r) => r.selected)}
                  onChange={(e) => setAiCatRows((prev) => prev.map((r) => ({ ...r, selected: e.target.checked })))}
                  className="w-4 h-4 rounded accent-purple-500"
                />
                <span className="text-xs text-slate-400">{aiCatRows.filter((r) => r.selected).length} of {aiCatRows.length} selected</span>
              </div>

              {/* Item rows */}
              <div className="divide-y divide-slate-800/60">
                {aiCatRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      row.selected ? '' : 'opacity-40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => setAiCatRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: e.target.checked } : r))}
                      className="w-4 h-4 rounded accent-purple-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{row.name}</p>
                      <p className="text-xs text-slate-600">{row.unit}</p>
                    </div>
                    <div className="shrink-0 w-44">
                      <CategoryCombobox
                        value={row.editCategory}
                        categories={[...PRESET_CATEGORIES]}
                        onChange={(val) => setAiCatRows((prev) => prev.map((r, i) => i === idx ? { ...r, editCategory: val } : r))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!aiCatDone && !aiCatLoading && !aiCatError && !aiCatInfo && (
          <div className="border-t border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-950/95 backdrop-blur">
            <p className="text-xs text-slate-500">
              {aiCatRows.filter((r) => r.selected).length} item{aiCatRows.filter((r) => r.selected).length !== 1 ? 's' : ''} will be updated
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAiCatMode(false)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveAiCategories}
                disabled={aiCatSaving || aiCatRows.filter((r) => r.selected).length === 0}
                className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg text-sm hover:bg-purple-500 disabled:opacity-40 transition-colors"
              >
                {aiCatSaving ? 'Saving…' : `Save ${aiCatRows.filter((r) => r.selected).length} Categories`}
              </button>
            </div>
          </div>
        )}
        {aiCatDone && (
          <div className="border-t border-slate-800 px-4 py-4 flex justify-end shrink-0">
            <button
              onClick={() => { setAiCatMode(false); setAiCatDone(false) }}
              className="px-5 py-2 bg-slate-800 text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    )}

    {countMode && (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Count Inventory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter what you see on the shelf. Leave blank to skip.</p>
          </div>
          <button
            onClick={() => { setCountMode(false); setCountDone(false); setAnalysisResult(null) }}
            className="text-slate-500 hover:text-slate-300 text-2xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Search + type filter — hidden on results screen */}
        <div className={`px-4 py-3 border-b border-slate-800 space-y-2 shrink-0 ${countDone ? 'hidden' : ''}`}>
          <input
            type="text"
            value={countSearch}
            onChange={(e) => setCountSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
            {(['all', 'beverage', 'food', 'paper'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCountTypeFilter(t)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                  countTypeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All' : t === 'beverage' ? 'Beverages' : t === 'food' ? 'Food' : 'Paper'}
              </button>
            ))}
          </div>
        </div>

        {/* Attention banner — only shown if there are items that need counting */}
        {needsAttentionCount > 0 && !countDone && (
          <div className="px-4 py-2.5 bg-amber-500/[0.07] border-b border-amber-500/20 flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80">
              <span className="font-semibold">{needsAttentionCount} item{needsAttentionCount !== 1 ? 's' : ''}</span> sold since last count — sorted to top
            </p>
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto">
          {countDone ? (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Saved banner */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 shrink-0">
                <span className="text-emerald-400 text-xl leading-none">✓</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Count saved!</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {analyzing ? 'Analyzing discrepancies…' : analysisResult?.summary ?? 'No expected quantities to compare.'}
                  </p>
                </div>
                {analyzing && (
                  <div className="ml-auto w-4 h-4 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin shrink-0" />
                )}
              </div>

              {/* Analysis results */}
              {!analyzing && analysisResult && analysisResult.findings.length > 0 && (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                  {analysisResult.findings
                    .sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent))
                    .map((f) => {
                      const isShort = f.gap < 0
                      const severityColor = Math.abs(f.gapPercent) >= 15
                        ? 'text-red-400 bg-red-500/10 border-red-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      return (
                        <div key={f.id} className="px-4 py-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">{f.name}</p>
                              {f.category && <p className="text-xs text-slate-600 mt-0.5">{f.category}</p>}
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded border ${severityColor}`}>
                              {isShort ? '▼' : '▲'} {Math.abs(f.gapPercent)}% {isShort ? 'short' : 'over'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Expected <span className="text-slate-300">{Number(f.expected.toFixed(2))}</span> · Counted <span className="text-slate-300">{Number(f.actual.toFixed(2))}</span> {f.unit}
                          </p>
                          <ul className="space-y-1 mt-2">
                            {f.reasons.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                <span className="text-slate-600 shrink-0 mt-0.5">•</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                </div>
              )}

              {!analyzing && analysisResult && analysisResult.findings.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 px-8 text-center">
                  <p className="text-2xl">✓</p>
                  <p className="text-sm font-medium text-emerald-400">Everything looks good</p>
                  <p className="text-xs text-slate-500">No significant discrepancies found.</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-800 px-4 py-4 flex items-center justify-between gap-3 shrink-0 bg-slate-950/95 backdrop-blur">
                <a
                  href="/variance-reports"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View Variance Reports →
                </a>
                <button
                  onClick={() => { setCountMode(false); setCountDone(false); setAnalysisResult(null) }}
                  className="px-5 py-2 bg-slate-800 text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : countFiltered.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-600 text-sm">No items match.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {countFiltered.map((item) => {
                const val = countValues[item.id] ?? ''
                const hasVal = val !== ''

                // Use real expected-on-hand if available (accounts for sales since last count),
                // else fall back to stock-levels estimate or last physical count
                const expItem = expectedMap[item.id]
                const expected = expItem
                  ? expItem.expected_qty
                  : (item.has_estimate ? item.estimated_qty : item.quantity_on_hand)

                // Highlight when this item has been sold since last count and isn't entered yet
                const soldSinceCount = needsAttentionIds.has(item.id)
                const needsHighlight = soldSinceCount && !hasVal

                const actual = hasVal ? parseFloat(val) : null
                const gapSeverity = (() => {
                  if (actual === null || expected === null || expected <= 0) return 'none'
                  const pct = Math.abs(actual - expected) / expected
                  if (pct <= 0.05) return 'ok'
                  if (pct <= 0.15) return 'warn'
                  return 'critical'
                })()
                const inputBorder = needsHighlight
                  ? 'border-amber-500/40 focus:border-amber-500'
                  : {
                    none: 'border-slate-700 focus:border-amber-500/60',
                    ok: 'border-emerald-500/60 focus:border-emerald-500',
                    warn: 'border-amber-500/60 focus:border-amber-500',
                    critical: 'border-red-500/60 focus:border-red-500',
                  }[gapSeverity]
                const gapIndicator = {
                  none: null,
                  ok: <span className="text-emerald-400 text-sm leading-none">✓</span>,
                  warn: <span className="text-amber-400 text-sm leading-none">⚠</span>,
                  critical: <span className="text-red-400 text-sm leading-none">✗</span>,
                }[gapSeverity]

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors border-l-2 ${
                      needsHighlight
                        ? 'bg-amber-500/[0.06] border-amber-500/50'
                        : gapSeverity === 'critical' ? 'bg-red-500/5 border-transparent' :
                          gapSeverity === 'warn'     ? 'bg-amber-500/5 border-transparent' :
                          gapSeverity === 'ok'       ? 'bg-emerald-500/5 border-transparent' :
                                                       'border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${needsHighlight ? 'text-amber-100' : 'text-slate-200'}`}>
                          {item.name}
                        </p>
                        {needsHighlight && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            Count this
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.category && <span className="text-xs text-slate-600">{item.category}</span>}
                        {expected !== null ? (
                          <span className={`text-xs ${needsHighlight ? 'text-amber-400/90' : 'text-slate-500'}`}>
                            Expected:{' '}
                            <span className={`font-medium ${needsHighlight ? 'text-amber-300' : 'text-slate-300'}`}>
                              {Number(expected.toFixed(2))} {UNIT_LABELS[item.unit] ?? item.unit}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">No prior count</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gapIndicator}
                      {Object.prototype.hasOwnProperty.call(BOTTLE_SIZE_OZ, item.unit) && (
                        <button
                          onClick={() => setScanTarget({ itemId: item.id, itemName: item.name, unit: item.unit })}
                          className="text-slate-600 hover:text-amber-400 active:text-amber-300 transition-colors text-base leading-none p-1"
                          title="Scan bottle to measure fill level"
                        >
                          📷
                        </button>
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={val}
                        onChange={(e) => setCountValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="—"
                        className={`w-20 text-right bg-slate-900 border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none transition-colors ${inputBorder}`}
                      />
                      <span className="text-xs text-slate-500 w-14 truncate">{UNIT_LABELS[item.unit] ?? item.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer — only show during entry, not on results screen */}
        {!countDone && (
          <div className="border-t border-slate-800 px-4 py-4 flex items-center justify-between gap-4 shrink-0 bg-slate-950/95 backdrop-blur">
            <p className="text-xs text-slate-500">
              {countEntered > 0
                ? `${countEntered} item${countEntered !== 1 ? 's' : ''} entered`
                : 'No quantities entered yet'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCountMode(false)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveCount}
                disabled={countSaving || countEntered === 0}
                className="px-5 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {countSaving ? 'Saving…' : `Save ${countEntered > 0 ? countEntered : ''} Count${countEntered !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    )}
    </>
  )
}

// ── Bottle Scan Modal ──────────────────────────────────────────────────────

interface ScanResult {
  fill_percent: number
  confidence: 'high' | 'medium' | 'low'
  bottle_name: string | null
  notes: string
}

function BottleScanModal({
  itemName, unit, bottleSizeOz, onConfirm, onClose,
}: {
  itemName: string
  unit: string
  bottleSizeOz: number
  onConfirm: (fraction: number) => void
  onClose: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [adjusted, setAdjusted] = useState(50)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  async function handleScan() {
    if (!file) return
    setScanning(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/inventory-counts/bottle-scan', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Scan failed'); setScanning(false); return }
      setResult(data)
      setAdjusted(data.fill_percent)
    } catch {
      setError('Failed to analyze image. Try again.')
    }
    setScanning(false)
  }

  const fraction = adjusted / 100
  const oz = (fraction * bottleSizeOz).toFixed(1)
  const confidenceColor = result?.confidence === 'high' ? 'text-emerald-400' : result?.confidence === 'medium' ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100">Scan Bottle</h2>
            <p className="text-xs text-slate-500 mt-0.5">{itemName}</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 text-xl leading-none">✕</button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Photo capture */}
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-xl h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <span className="text-4xl">📷</span>
              <p className="text-sm text-slate-400">Tap to take a photo or upload</p>
              <p className="text-xs text-slate-600">Hold bottle up so liquid level is visible</p>
            </div>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Bottle" className="w-full max-h-52 object-contain rounded-xl border border-slate-800 bg-slate-900" />
              {!result && (
                <button
                  onClick={() => { setPreview(null); setFile(null); setResult(null) }}
                  className="absolute top-2 right-2 bg-slate-900/80 text-slate-400 hover:text-slate-200 rounded-full w-7 h-7 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Scan button — show before result */}
          {preview && !result && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : 'Measure Fill Level'}
            </button>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Bottle fill visualization */}
              <div className="flex items-center gap-5">
                {/* Visual bottle */}
                <div className="relative w-14 shrink-0">
                  {/* Neck */}
                  <div className="w-5 h-4 bg-slate-800 border border-slate-700 rounded-t-lg mx-auto" />
                  {/* Body */}
                  <div className="relative h-28 bg-slate-800 border border-slate-700 rounded-b-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-amber-500/50 transition-all duration-300"
                      style={{ height: `${adjusted}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-100">
                      {adjusted}%
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                  {result.bottle_name && (
                    <p className="text-sm font-semibold text-slate-200">{result.bottle_name}</p>
                  )}
                  <p className="text-xs text-slate-400">{result.notes}</p>
                  <p className={`text-xs font-medium ${confidenceColor}`}>
                    {result.confidence === 'high' ? '✓ High confidence' : result.confidence === 'medium' ? '~ Medium confidence' : '⚠ Low confidence — adjust below'}
                  </p>
                  <p className="text-xs text-slate-500">≈ {oz} oz remaining</p>
                </div>
              </div>

              {/* Adjustment slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Adjust if needed</label>
                  <span className="text-xs text-amber-400 font-bold">{adjusted}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={adjusted}
                  onChange={(e) => setAdjusted(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
                  <span>Empty</span>
                  <span>Full</span>
                </div>
              </div>

              {/* Confirm */}
              <button
                onClick={() => onConfirm(fraction)}
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm hover:bg-amber-400 transition-colors"
              >
                Use {fraction.toFixed(2)} {UNIT_LABELS[unit] ?? unit} ({oz} oz)
              </button>
              <p className="text-[11px] text-slate-600 text-center">
                This fills in the count for {itemName}. Add whole sealed bottles to it manually.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fractionLabel(f: number): string {
  if (f >= 0.88) return 'almost full'
  if (f >= 0.63) return '¾ full'
  if (f >= 0.38) return '½ full'
  if (f >= 0.13) return '¼ full'
  return 'nearly empty'
}

const KEG_PINTS: Record<string, number> = {
  keg: 165,
  quarterkeg: 62,
  sixthkeg: 41,
}

function KegLevelDisplay({ qty, unit }: { qty: number; unit: string }) {
  const totalPints = KEG_PINTS[unit] ?? 165
  const wholeKegs = Math.floor(qty)
  const fraction = parseFloat((qty % 1).toFixed(2))
  const hasFraction = fraction > 0.01
  // Pints in the partial keg (or in a single fractional keg count)
  const partialPints = Math.round(fraction * totalPints)
  // Total pints across all kegs
  const allPints = Math.round(qty * totalPints)

  const fillPct = Math.round((hasFraction ? fraction : qty > 0 ? 1 : 0) * 100)

  return (
    <div className="space-y-1.5 pt-0.5">
      {/* Fill bar — always show for kegs */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">
            {hasFraction && wholeKegs > 0
              ? `+1 partial keg`
              : hasFraction
                ? 'Keg level'
                : 'Full keg'}
          </span>
          <span className="text-[10px] text-slate-500">
            {hasFraction ? fractionLabel(fraction) : '100%'}
          </span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${hasFraction ? fillPct : 100}%`,
              background: fillPct > 50
                ? 'rgb(52 211 153 / 0.6)'   // emerald
                : fillPct > 25
                  ? 'rgb(251 191 36 / 0.6)' // amber
                  : 'rgb(248 113 113 / 0.6)', // red
            }}
          />
        </div>
      </div>
      {allPints > 0 && (
        <p className="text-[10px] text-slate-600">~{allPints} pints remaining</p>
      )}
    </div>
  )
}

function PartialBottleDisplay({ qty, bottleSizeOz, isWine = false }: { qty: number; bottleSizeOz: number; isWine?: boolean }) {
  const fraction = qty % 1
  const hasFraction = fraction > 0.02
  const pourOz = isWine ? STANDARD_WINE_GLASS_OZ : STANDARD_SHOT_OZ
  const totalPours = Math.floor((qty * bottleSizeOz) / pourOz)
  const pourLabel = isWine ? 'glasses' : 'shots'

  return (
    <div className="space-y-1.5 pt-0.5">
      {hasFraction && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Open bottle</span>
            <span className="text-[10px] text-slate-500">{fractionLabel(fraction)}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500/50 rounded-full"
              style={{ width: `${Math.round(fraction * 100)}%` }}
            />
          </div>
        </div>
      )}
      {totalPours > 0 && (
        <p className="text-[10px] text-slate-600">~{totalPours} {pourLabel}</p>
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
  const [cases, setCases] = useState('')
  const [loosePcs, setLoosePcs] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const itemIsFood = item.item_type === 'food'
  const unitOptions = itemIsFood ? FOOD_UNITS_LIST : BEVERAGE_UNITS
  const isFoodCase = item.item_type === 'food' &&
    (item.unit === 'lb' || item.unit === 'oz' || item.unit === 'each') &&
    (item.pack_size ?? 0) > 1

  function openEdit() {
    setName(item.name)
    setCategory(item.category ?? '')
    setUnit(item.unit)
    const raw = item.quantity_on_hand
    if (isFoodCase && raw !== null && item.pack_size) {
      setCases(String(Math.floor(raw / item.pack_size)))
      setLoosePcs(String(Math.round((raw % item.pack_size) * 100) / 100))
      setQuantity('')
    } else {
      setQuantity(raw?.toString() ?? '')
      setCases('')
      setLoosePcs('')
    }
    setErr(null)
    setEditing(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  async function handleSave() {
    if (!name.trim()) { setErr('Name required'); return }
    if (!unit) { setErr('Unit required'); return }
    setSaving(true)
    setErr(null)
    let qtyToSend: number | null = null
    if (isFoodCase && item.pack_size) {
      const c = parseInt(cases || '0') || 0
      const l = parseFloat(loosePcs || '0') || 0
      const total = c * item.pack_size + l
      qtyToSend = total > 0 ? total : null
    } else {
      qtyToSend = quantity !== '' ? parseFloat(quantity) : null
    }
    const res = await fetch('/api/stock-levels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        name: name.trim(),
        category: category || null,
        unit,
        quantity_on_hand: qtyToSend,
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
      quantity_on_hand: qtyToSend ?? item.quantity_on_hand,
      count_date: qtyToSend !== null ? new Date().toISOString().slice(0, 10) : item.count_date,
      // Clear stale estimate so card immediately shows the new physical count
      ...(qtyToSend !== null ? { has_estimate: false, estimated_qty: null } : {}),
    })
    setEditing(false)
  }

  const status = staleness(item)
  const dotColor = { fresh: 'bg-emerald-400', aging: 'bg-amber-400', stale: 'bg-red-400', never: 'bg-slate-600' }[status]
  const effectiveQty = item.has_estimate ? item.estimated_qty : item.quantity_on_hand
  const qtyColor = effectiveQty === null
    ? 'text-slate-600'
    : effectiveQty === 0
      ? 'text-red-400'
      : item.has_estimate
        ? 'text-sky-400'
        : 'text-slate-100'
  const bottleSizeOz = BOTTLE_SIZE_OZ[item.unit] ?? null

  if (editing) {
    return (
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3">
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
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u] ?? u}</option>
                ))}
                {/* Allow keeping current unit even if it's from a different type */}
                {!unitOptions.includes(unit) && (
                  <option value={unit}>{UNIT_LABELS[unit] ?? unit}</option>
                )}
              </select>
            </div>
            {isFoodCase ? (
              <div className="col-span-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Cases</label>
                <input
                  type="number" min="0" step="1"
                  value={cases}
                  onChange={(e) => setCases(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            ) : (
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
            )}
          </div>
          {isFoodCase && (
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                Loose {item.unit === 'each' ? 'units' : item.unit}
                {item.pack_size ? <span className="text-slate-700 ml-1">({item.pack_size} {item.unit}/case)</span> : null}
              </label>
              <input
                type="number" min="0" step="any"
                value={loosePcs}
                onChange={(e) => setLoosePcs(e.target.value)}
                placeholder="0"
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
              {(cases !== '' || loosePcs !== '') && item.pack_size && (
                <p className="text-[10px] text-slate-500 mt-1">
                  = {(parseInt(cases || '0') || 0) * item.pack_size + (parseFloat(loosePcs || '0') || 0)} {item.unit} total
                </p>
              )}
            </div>
          )}
          {!isFoodCase && quantity !== '' && (
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors group">
      {/* Name + dot + edit button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-200 leading-snug">{item.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={openEdit}
            className="text-slate-500 hover:text-amber-400 active:text-amber-300 transition-all text-sm leading-none p-1"
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

      {/* Quantity + breakdown */}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-1.5">
          <p className={`text-3xl font-bold tabular-nums leading-none ${qtyColor}`}>
            {isFoodCase && effectiveQty !== null && item.pack_size
              ? Math.floor(effectiveQty / item.pack_size)
              : effectiveQty !== null ? formatQty(effectiveQty, item.unit) : '—'}
          </p>
          {item.has_estimate && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold leading-tight">Est.</span>
          )}
        </div>
        {isFoodCase && item.pack_size && effectiveQty !== null ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">cases ({item.pack_size}{item.unit === 'each' ? ' ct/case' : ` ${item.unit} each`})</p>
            {(() => {
              const loose = Math.round((effectiveQty % item.pack_size) * 100) / 100
              const looseLabel = item.unit === 'each' ? 'loose' : `${item.unit} loose`
              return loose > 0 ? (
                <p className="text-xs font-medium text-amber-400/80 leading-snug">+ {loose} {looseLabel}</p>
              ) : null
            })()}
          </div>
        ) : item.pack_size && item.pack_size > 1 && effectiveQty !== null && effectiveQty > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">{item.unit}</p>
            <p className="text-xs font-medium text-amber-400/80 leading-snug">
              {formatPackBreakdown(effectiveQty, item.pack_size, item.package_type).split(' · ')[1]}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-500">{item.unit}</p>
            {item.package_type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/60 font-medium leading-tight">
                {item.package_type}
              </span>
            )}
          </div>
        )}
        {item.has_estimate && item.quantity_on_hand !== null && item.pack_size && (
          <p className="text-[10px] text-slate-700">Count: {Math.floor(item.quantity_on_hand / item.pack_size)} cases · {daysAgo(item.count_date!)}d ago</p>
        )}
        {item.has_estimate && item.quantity_on_hand !== null && !item.pack_size && (
          <p className="text-[10px] text-slate-700">Count: {item.quantity_on_hand} · {daysAgo(item.count_date!)}d ago</p>
        )}

        {/* Partial bottle display for bottle-tracked spirits/wine */}
        {bottleSizeOz !== null && effectiveQty !== null && effectiveQty > 0 && (
          <PartialBottleDisplay qty={effectiveQty} bottleSizeOz={bottleSizeOz} isWine={WINE_UNITS.has(item.unit)} />
        )}

        {/* Keg level display */}
        {KEG_PINTS[item.unit] !== undefined && effectiveQty !== null && effectiveQty > 0 && (
          <KegLevelDisplay qty={effectiveQty} unit={item.unit} />
        )}
      </div>

      {/* Last counted */}
      <p className="text-[11px] text-slate-600 mt-auto">
        {item.has_estimate
          ? 'Live estimate'
          : item.count_date
            ? `Counted ${daysAgo(item.count_date) === 0 ? 'today' : `${daysAgo(item.count_date)}d ago`}`
            : 'Never counted'}
      </p>
    </div>
  )
}
