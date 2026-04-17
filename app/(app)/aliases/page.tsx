'use client'

import { useEffect, useState } from 'react'
import type { UnmatchedMenuItem, UnmatchedData } from '@/app/api/aliases/unmatched/route'

interface MenuItem  { id: string; name: string }
interface InvItem   { id: string; name: string }

type Suggestion = { id: string; name: string; confidence: 'high' | 'medium' | 'low' }

interface RowState {
  raw_name:    string
  suggestion:  Suggestion | null
  selectedId:  string
  search:      string
  dropOpen:    boolean
  confirmed:   boolean
  saving:      boolean
}

function confidenceColor(c: 'high' | 'medium' | 'low') {
  if (c === 'high')   return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (c === 'medium') return 'text-amber-400   bg-amber-500/10   border-amber-500/20'
  return                     'text-slate-400   bg-slate-800      border-slate-700'
}

export default function AliasesPage() {
  const [menuRows, setMenuRows]       = useState<RowState[]>([])
  const [invRows,  setInvRows]        = useState<RowState[]>([])
  const [menuItems,  setMenuItems]    = useState<MenuItem[]>([])
  const [invItems,   setInvItems]     = useState<InvItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [confirmingAll, setConfirmingAll] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [u, menu, inv] = await Promise.all([
      fetch('/api/aliases/unmatched').then((r) => r.json()),
      fetch('/api/menu-items').then((r) => r.json()),
      fetch('/api/inventory-items').then((r) => r.json()),
    ])

    const data: UnmatchedData & { inventory_items?: typeof u.inventory_items } = u
    const menuItemsList: MenuItem[] = Array.isArray(menu) ? menu : []
    const invItemsList:  InvItem[]  = Array.isArray(inv)  ? inv  : []
    setMenuItems(menuItemsList)
    setInvItems(invItemsList)

    const toRowState = (item: UnmatchedMenuItem): RowState => ({
      raw_name:   item.raw_name,
      suggestion: item.suggestion ?? null,
      selectedId: item.suggestion?.id ?? '',
      search:     '',
      dropOpen:   false,
      confirmed:  false,
      saving:     false,
    })

    setMenuRows((data.menu_items ?? []).map(toRowState))
    setInvRows((data.inventory_items ?? []).map(toRowState))
    setLoading(false)
  }

  async function saveAlias(type: 'menu' | 'inventory', rawName: string, targetId: string) {
    const res = await fetch('/api/aliases/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // overwrite_existing: true — user's explicit match overwrites any previous
      // incorrect auto-link so historical sales/counts are fully corrected.
      body: JSON.stringify({ type, raw_name: rawName, target_id: targetId, overwrite_existing: true }),
    })
    return res.ok
  }

  async function confirmRow(type: 'menu' | 'inventory', rawName: string, targetId: string) {
    const setter = type === 'menu' ? setMenuRows : setInvRows
    setter((prev) => prev.map((r) => r.raw_name === rawName ? { ...r, saving: true } : r))
    const ok = await saveAlias(type, rawName, targetId)
    setter((prev) => prev.map((r) => r.raw_name === rawName ? { ...r, saving: false, confirmed: ok } : r))
  }

  async function confirmAllSuggested(type: 'menu' | 'inventory') {
    setConfirmingAll(true)
    const rows = type === 'menu' ? menuRows : invRows
    const toConfirm = rows.filter((r) => !r.confirmed && r.selectedId && r.suggestion)
    for (const row of toConfirm) {
      await confirmRow(type, row.raw_name, row.selectedId)
    }
    setConfirmingAll(false)
  }

  const pendingMenu = menuRows.filter((r) => !r.confirmed)
  const pendingInv  = invRows.filter((r) => !r.confirmed)
  const suggestedMenuCount = pendingMenu.filter((r) => r.suggestion).length
  const suggestedInvCount  = pendingInv.filter((r) => r.suggestion).length

  if (loading) return <p className="text-slate-500 text-sm p-6">Loading…</p>

  const allDone = pendingMenu.length === 0 && pendingInv.length === 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Name Aliases</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Links raw POS names to your menu and inventory items. Once saved, future syncs auto-match.
        </p>
      </div>

      {allDone ? (
        <div className="text-center py-16 border border-slate-800 border-dashed rounded-2xl text-slate-600">
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm">All names are linked. Stock deductions will work on the next sync.</p>
        </div>
      ) : (
        <>
          {/* ── Unmatched Menu / Sales Names ── */}
          {pendingMenu.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm">Unlinked Sales Items</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Raw names from your POS that don't match any menu item yet.
                  </p>
                </div>
                {suggestedMenuCount > 0 && (
                  <button
                    onClick={() => confirmAllSuggested('menu')}
                    disabled={confirmingAll}
                    className="shrink-0 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    {confirmingAll ? 'Saving…' : `Confirm All (${suggestedMenuCount})`}
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-800/60">
                {pendingMenu.map((row) => (
                  <AliasRow
                    key={row.raw_name}
                    row={row}
                    options={menuItems}
                    onSelect={(id) => setMenuRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, selectedId: id, search: '', dropOpen: false } : r))}
                    onSearchChange={(s) => setMenuRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, search: s, dropOpen: true } : r))}
                    onDropToggle={(open) => setMenuRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, dropOpen: open } : r))}
                    onConfirm={() => confirmRow('menu', row.raw_name, row.selectedId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Unmatched Inventory Names ── */}
          {pendingInv.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm">Unlinked Inventory Names</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Raw names from purchase or count imports that don't match any inventory item.
                  </p>
                </div>
                {suggestedInvCount > 0 && (
                  <button
                    onClick={() => confirmAllSuggested('inventory')}
                    disabled={confirmingAll}
                    className="shrink-0 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    {confirmingAll ? 'Saving…' : `Confirm All (${suggestedInvCount})`}
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-800/60">
                {pendingInv.map((row) => (
                  <AliasRow
                    key={row.raw_name}
                    row={row}
                    options={invItems}
                    onSelect={(id) => setInvRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, selectedId: id, search: '', dropOpen: false } : r))}
                    onSearchChange={(s) => setInvRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, search: s, dropOpen: true } : r))}
                    onDropToggle={(open) => setInvRows((prev) => prev.map((r) => r.raw_name === row.raw_name ? { ...r, dropOpen: open } : r))}
                    onConfirm={() => confirmRow('inventory', row.raw_name, row.selectedId)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AliasRow({
  row, options, onSelect, onSearchChange, onDropToggle, onConfirm,
}: {
  row:            RowState
  options:        { id: string; name: string }[]
  onSelect:       (id: string) => void
  onSearchChange: (s: string) => void
  onDropToggle:   (open: boolean) => void
  onConfirm:      () => void
}) {
  const selectedLabel = options.find((o) => o.id === row.selectedId)?.name ?? ''
  const displayValue  = row.dropOpen ? row.search : selectedLabel
  const filtered      = options.filter((o) => o.name.toLowerCase().includes(row.search.toLowerCase()))

  return (
    <div className="px-5 py-4">
      {/* Raw name + suggestion badge */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <code className="text-sm text-amber-300/80 bg-slate-800 px-2.5 py-1 rounded font-mono break-all">
          {row.raw_name}
        </code>
        {row.suggestion && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${confidenceColor(row.suggestion.confidence)}`}>
            {row.suggestion.confidence} match
          </span>
        )}
      </div>

      {/* Suggestion chip — click to accept, or use search below to override */}
      {row.suggestion && !row.selectedId && (
        <button
          onClick={() => onSelect(row.suggestion!.id)}
          className="mb-3 w-full text-left px-3 py-2.5 bg-slate-800/60 border border-slate-700 hover:border-amber-500/40 rounded-lg transition-colors group"
        >
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Suggested match</p>
          <p className="text-sm text-slate-200 group-hover:text-amber-300 transition-colors">{row.suggestion.name}</p>
        </button>
      )}

      {/* Search + confirm row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={row.selectedId ? selectedLabel : 'Search to override…'}
            value={displayValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => onDropToggle(true)}
            onBlur={() => setTimeout(() => onDropToggle(false), 150)}
            className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none placeholder-slate-600 ${
              row.selectedId ? 'border-amber-500/40 focus:border-amber-500/60' : 'border-slate-700 focus:border-slate-600'
            }`}
          />
          {row.selectedId && !row.dropOpen && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 text-xs pointer-events-none">✓</span>
          )}
          {row.dropOpen && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500">No matches</p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onMouseDown={() => onSelect(o.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                      row.selectedId === o.id ? 'text-amber-400 bg-slate-700/50' : 'text-slate-200'
                    }`}
                  >
                    {o.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          onClick={onConfirm}
          disabled={!row.selectedId || row.saving}
          className="shrink-0 px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-40 transition-colors min-w-[72px]"
        >
          {row.saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
