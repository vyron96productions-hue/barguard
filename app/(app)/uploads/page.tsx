'use client'

import { useState, useEffect, useRef } from 'react'
import CsvUploader from '@/components/CsvUploader'
import type { CsvUploadType } from '@/types'

const tabs: { id: CsvUploadType; label: string; description: string }[] = [
  { id: 'sales', label: 'Sales', description: 'Upload your POS sales export. Requires date, item name, and quantity sold.' },
  { id: 'inventory', label: 'Inventory Count', description: 'Upload your physical inventory count. Requires count date, item name, and quantity on hand.' },
  { id: 'purchases', label: 'Purchases', description: 'Upload your purchase/receiving log. Requires purchase date, item name, and quantity purchased.' },
]

interface UploadResult {
  rows_imported: number
  unresolved_aliases: string[]
}

export default function UploadsPage() {
  const [activeTab, setActiveTab] = useState<CsvUploadType>('sales')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [resolvedDone, setResolvedDone] = useState(false)

  function handleSuccess(result: UploadResult) {
    setUploadResult(result)
    setResolvedDone(false)
  }

  const activeTabInfo = tabs.find((t) => t.id === activeTab)!

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Upload Data</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload your sales, inventory, and purchase reports in CSV format.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setUploadResult(null); setResolvedDone(false) }}
            className={`flex-1 py-2.5 px-2 rounded text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-sm text-gray-400">{activeTabInfo.description}</p>
        <CsvUploader key={activeTab} type={activeTab} onSuccess={handleSuccess} />

        {uploadResult && (
          <div className="space-y-3">
            {/* Success banner */}
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
              <span className="text-emerald-400 text-lg leading-none">✓</span>
              <p className="text-emerald-400 text-sm font-medium">
                {uploadResult.rows_imported} rows imported successfully
              </p>
            </div>

            {/* Unresolved aliases resolver */}
            {activeTab === 'sales' && uploadResult.unresolved_aliases.length > 0 && !resolvedDone && (
              <AliasResolver
                unresolved={uploadResult.unresolved_aliases}
                onDone={() => setResolvedDone(true)}
              />
            )}

            {resolvedDone && (
              <div className="flex items-center gap-3 bg-sky-500/10 border border-sky-500/30 rounded-lg px-4 py-3">
                <span className="text-sky-400 text-lg leading-none">✓</span>
                <p className="text-sky-400 text-sm font-medium">All items matched — sales data is fully linked.</p>
              </div>
            )}

            {activeTab === 'sales' && uploadResult.unresolved_aliases.length === 0 && (
              <p className="text-xs text-slate-500">All item names matched to your menu.</p>
            )}
          </div>
        )}
      </div>

      {/* Sample CSV hints */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Sample format for {activeTabInfo.label}</h3>
        <SampleCsv type={activeTab} />
      </div>
    </div>
  )
}

// ── Alias Resolver ───────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: string
  category: string | null
}

interface AliasRow {
  rawName: string
  selectedId: string | null   // menu_item_id or '' for "create new"
  creating: boolean           // currently creating a new item
  skip: boolean
}

function AliasResolver({ unresolved, onDone }: { unresolved: string[]; onDone: () => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [rows, setRows] = useState<AliasRow[]>(
    unresolved.map((rawName) => ({ rawName, selectedId: null, creating: false, skip: false }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/menu-items')
      .then((r) => r.json())
      .then((data) => setMenuItems(Array.isArray(data) ? data.map((m: MenuItem) => ({ id: m.id, name: m.name, category: m.category })) : []))
      .catch(() => setMenuItems([]))
      .finally(() => setLoadingItems(false))
  }, [])

  async function handleCreateNew(idx: number) {
    const row = rows[idx]
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, creating: true } : r))
    try {
      const res = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: row.rawName }),
      })
      const data = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Create failed')
      const newItem: MenuItem = { id: data.id, name: data.name, category: data.category }
      setMenuItems((prev) => [...prev, newItem])
      setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selectedId: data.id, creating: false } : r))
    } catch (e) {
      setRows((prev) => prev.map((r, i) => i === idx ? { ...r, creating: false } : r))
      setError(e instanceof Error ? e.message : 'Failed to create item')
    }
  }

  async function saveMatches() {
    const resolutions = rows
      .filter((r) => !r.skip && r.selectedId)
      .map((r) => ({ raw_name: r.rawName, menu_item_id: r.selectedId! }))

    if (resolutions.length === 0) { onDone(); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/sales/resolve-aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  const matchedCount = rows.filter((r) => r.selectedId && !r.skip).length
  const skippedCount = rows.filter((r) => r.skip).length

  return (
    <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-500/20 flex items-start gap-3">
        <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-semibold text-amber-300">
            {unresolved.length} item{unresolved.length !== 1 ? 's' : ''} couldn&apos;t be matched
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Match each name to an existing menu item or create it as a new one so your sales data links correctly.
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-800/60">
        {rows.map((row, idx) => (
          <AliasRow
            key={row.rawName}
            row={row}
            menuItems={menuItems}
            loadingItems={loadingItems}
            onSelect={(id) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selectedId: id, skip: false } : r))}
            onCreateNew={() => handleCreateNew(idx)}
            onSkip={() => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, skip: !r.skip, selectedId: r.skip ? r.selectedId : null } : r))}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-900/40">
        <p className="text-xs text-slate-500">
          {matchedCount} matched{skippedCount > 0 ? ` · ${skippedCount} skipped` : ''}
        </p>
        {error && <p className="text-xs text-red-400 flex-1 text-center">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={onDone}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
          >
            Skip all
          </button>
          <button
            onClick={saveMatches}
            disabled={saving || matchedCount === 0}
            className="px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : `Save ${matchedCount > 0 ? matchedCount : ''} Match${matchedCount !== 1 ? 'es' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function AliasRow({
  row, menuItems, loadingItems, onSelect, onCreateNew, onSkip,
}: {
  row: AliasRow
  menuItems: MenuItem[]
  loadingItems: boolean
  onSelect: (id: string) => void
  onCreateNew: () => void
  onSkip: () => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = menuItems.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedItem = menuItems.find((m) => m.id === row.selectedId)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={`px-4 py-3 flex items-center gap-3 transition-colors ${row.skip ? 'opacity-40' : ''}`}>
      {/* Raw name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{row.rawName}</p>
        {row.creating && <p className="text-xs text-purple-400 mt-0.5">Creating…</p>}
        {selectedItem && !row.creating && (
          <p className="text-xs text-emerald-400 mt-0.5">→ {selectedItem.name}</p>
        )}
      </div>

      {/* Dropdown */}
      {!row.skip && (
        <div ref={ref} className="relative shrink-0 w-52">
          <button
            onClick={() => setOpen((v) => !v)}
            disabled={row.creating || loadingItems}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs transition-colors text-left ${
              selectedItem
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="truncate">
              {loadingItems ? 'Loading…' : selectedItem ? selectedItem.name : 'Select or create…'}
            </span>
            <span className="text-slate-600 shrink-0">▾</span>
          </button>

          {open && (
            <div className="absolute z-20 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-800">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search menu items…"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {/* Create new option */}
                <button
                  onClick={() => { setOpen(false); onCreateNew() }}
                  className="w-full text-left px-3 py-2.5 text-xs text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-2 border-b border-slate-800"
                >
                  <span className="text-purple-400">✦</span>
                  Create &quot;{row.rawName}&quot; as new menu item
                </button>
                {/* Existing items */}
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-600">No items found</p>
                ) : (
                  filtered.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { onSelect(m.id); setOpen(false); setSearch('') }}
                      className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 ${
                        m.id === row.selectedId
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      {m.category && <span className="text-slate-600 shrink-0">{m.category}</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skip toggle */}
      <button
        onClick={onSkip}
        className={`shrink-0 text-xs px-2 py-1 rounded transition-colors ${
          row.skip
            ? 'text-amber-400 hover:text-slate-400'
            : 'text-slate-600 hover:text-slate-400'
        }`}
        title={row.skip ? 'Undo skip' : 'Skip this item'}
      >
        {row.skip ? 'undo' : 'skip'}
      </button>
    </div>
  )
}

function SampleCsv({ type }: { type: CsvUploadType }) {
  const samples: Record<CsvUploadType, string> = {
    sales: 'date,item_name,quantity_sold,gross_sales\n2024-03-01,Vodka Soda,12,84.00\n2024-03-01,Margarita,8,64.00',
    inventory: 'count_date,item_name,quantity_on_hand,unit_type\n2024-03-01,Tito\'s Vodka,48.5,oz\n2024-03-01,Bacardi White Rum,32,oz',
    purchases: 'purchase_date,item_name,quantity_purchased,vendor_name,unit_cost\n2024-03-05,Tito\'s Vodka,1,Southern Glazer\'s,22.50',
  }
  return (
    <div className="overflow-x-auto">
      <pre className="text-xs text-gray-500 bg-gray-950 rounded p-3">{samples[type]}</pre>
    </div>
  )
}
