'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import CategoryCombobox from '@/components/CategoryCombobox'
import { formatPackBreakdown } from '@/lib/beer-packaging'
import { UNIT_LABELS, formatQty } from '@/lib/conversions'

const BEVERAGE_CATEGORIES = [
  'spirits', 'beer', 'wine', 'keg',
  'mixer', 'non-alcoholic',
  'rum', 'tequila', 'vodka', 'whiskey', 'gin', 'brandy', 'cognac',
]
const FOOD_CATEGORIES = [
  'food', 'kitchen', 'produce', 'protein', 'dairy', 'dry goods',
  'sauces', 'condiments', 'dessert', 'supply',
]
const PRESET_CATEGORIES = [...BEVERAGE_CATEGORIES, ...FOOD_CATEGORIES, 'other']

const BEVERAGE_UNITS = ['bottle', '1L', '1.75L', 'can', 'beer_bottle', 'pint', 'case', 'keg', 'halfkeg', 'quarterkeg', 'sixthkeg']
const FOOD_UNITS_LIST = ['each', 'piece', 'portion', 'serving', 'slice', 'lb', 'kg', 'g', 'bag', 'tray', 'box', 'flat', 'cup', 'tbsp', 'tsp', 'jar', 'packet']

// Bottle-type units and their oz size — used for partial bottle display
const BOTTLE_SIZE_OZ: Record<string, number> = {
  'bottle': 25.36,   // 750ml standard
  '750ml':  25.36,
  '1L':     33.814,
  '1.75L':  59.1745,
}
const STANDARD_SHOT_OZ = 1.5

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
type TypeFilter = 'all' | 'beverage' | 'food'

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

function isFood(item: StockItem) { return item.item_type === 'food' }

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

  useEffect(() => {
    fetch('/api/stock-levels')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function openCountMode() {
    setCountValues({})
    setCountSearch('')
    setCountTypeFilter('all')
    setCountDone(false)
    setAnalyzing(false)
    setAnalysisResult(null)
    setCountMode(true)
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
        const data = await res.json()
        setAnalysisResult(data)
      } catch {
        setAnalysisResult({ findings: [], summary: null })
      }
      setAnalyzing(false)
    } else {
      setAnalysisResult({ findings: [], summary: null })
    }
  }

  const countFiltered = items.filter((i) => {
    if (countTypeFilter === 'beverage' && isFood(i)) return false
    if (countTypeFilter === 'food' && !isFood(i)) return false
    if (countSearch && !i.name.toLowerCase().includes(countSearch.toLowerCase())) return false
    return true
  })

  const countEntered = Object.values(countValues).filter((v) => v !== '').length

  const beverageCount = items.filter((i) => !isFood(i)).length
  const foodCount = items.filter(isFood).length
  const hasBoth = beverageCount > 0 && foodCount > 0

  const typeFiltered = items.filter((i) => {
    if (typeFilter === 'beverage') return !isFood(i)
    if (typeFilter === 'food') return isFood(i)
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openCountMode}
            className="text-sm px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 active:bg-amber-300 transition-colors"
          >
            Count Now
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
        // Sectioned view: Beverages then Food
        <div className="space-y-5">
          {renderSection(visible.filter((i) => !isFood(i)), 'Beverages')}
          {renderSection(visible.filter(isFood), 'Food & Kitchen')}
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
            {(['all', 'beverage', 'food'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCountTypeFilter(t)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                  countTypeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All' : t === 'beverage' ? 'Beverages' : 'Food'}
              </button>
            ))}
          </div>
        </div>

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
                const expected = item.has_estimate ? item.estimated_qty : item.quantity_on_hand
                const actual = hasVal ? parseFloat(val) : null
                const gapSeverity = (() => {
                  if (actual === null || expected === null || expected <= 0) return 'none'
                  const pct = Math.abs(actual - expected) / expected
                  if (pct <= 0.05) return 'ok'
                  if (pct <= 0.15) return 'warn'
                  return 'critical'
                })()
                const inputBorder = {
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
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      gapSeverity === 'critical' ? 'bg-red-500/5' :
                      gapSeverity === 'warn' ? 'bg-amber-500/5' :
                      gapSeverity === 'ok' ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.category && <span className="text-xs text-slate-600">{item.category}</span>}
                        {expected !== null ? (
                          <span className="text-xs text-slate-500">
                            Expected: <span className="text-slate-300 font-medium">{Number(expected.toFixed(2))} {UNIT_LABELS[item.unit] ?? item.unit}</span>
                            {item.has_estimate && <span className="ml-1 text-sky-500/70">est.</span>}
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

function PartialBottleDisplay({ qty, bottleSizeOz }: { qty: number; bottleSizeOz: number }) {
  const fraction = qty % 1
  const hasFraction = fraction > 0.02
  const totalShots = Math.floor((qty * bottleSizeOz) / STANDARD_SHOT_OZ)

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
      {totalShots > 0 && (
        <p className="text-[10px] text-slate-600">~{totalShots} shots</p>
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

  const itemIsFood = item.item_type === 'food'
  const unitOptions = itemIsFood ? FOOD_UNITS_LIST : BEVERAGE_UNITS

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors group">
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

      {/* Quantity + breakdown */}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-1.5">
          <p className={`text-3xl font-bold tabular-nums leading-none ${qtyColor}`}>
            {effectiveQty !== null ? formatQty(effectiveQty, item.unit) : '—'}
          </p>
          {item.has_estimate && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold leading-tight">Est.</span>
          )}
        </div>
        {item.pack_size && item.pack_size > 1 && effectiveQty !== null && effectiveQty > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">{UNIT_LABELS[item.unit] ?? item.unit}</p>
            <p className="text-xs font-medium text-amber-400/80 leading-snug">
              {formatPackBreakdown(effectiveQty, item.pack_size, item.package_type).split(' · ')[1]}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-500">{UNIT_LABELS[item.unit] ?? item.unit}</p>
            {item.package_type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/60 font-medium leading-tight">
                {item.package_type}
              </span>
            )}
          </div>
        )}
        {item.has_estimate && item.quantity_on_hand !== null && (
          <p className="text-[10px] text-slate-700">Count: {item.quantity_on_hand} · {daysAgo(item.count_date!)}d ago</p>
        )}

        {/* Partial bottle display for bottle-tracked spirits */}
        {bottleSizeOz !== null && effectiveQty !== null && effectiveQty > 0 && (
          <PartialBottleDisplay qty={effectiveQty} bottleSizeOz={bottleSizeOz} />
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
