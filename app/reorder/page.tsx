'use client'

import { useState } from 'react'
import type { ReorderSuggestion } from '@/app/api/reorder-suggestions/route'

type Priority = 'urgent' | 'soon' | 'watch' | 'ok'

const PRIORITY_DOT: Record<Priority, string> = {
  urgent: 'bg-red-500',
  soon:   'bg-amber-500',
  watch:  'bg-slate-400',
  ok:     'bg-slate-600',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgent',
  soon:   'Soon',
  watch:  'Watch',
  ok:     'OK',
}

function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[priority]}`} />
  )
}

export default function ReorderPage() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [openOrderVendor, setOpenOrderVendor] = useState<string | null>(null)
  const [copiedVendor, setCopiedVendor] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')

  async function analyze() {
    setLoading(true)
    setError(null)
    setHasRun(false)
    setSuggestions([])
    setOpenOrderVendor(null)

    // Fetch business name if not loaded
    if (!businessName) {
      try {
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()
        if (meData.business_name) setBusinessName(meData.business_name)
      } catch { /* ignore */ }
    }

    const res = await fetch('/api/reorder-suggestions')
    const data = await res.json()
    setLoading(false)
    setHasRun(true)

    if (!res.ok) {
      setError(data.error ?? 'Failed to fetch suggestions')
      return
    }

    const list: ReorderSuggestion[] = Array.isArray(data) ? data : []
    setSuggestions(list)

    // Pre-populate quantity inputs with suggested_qty
    const initQty: Record<string, number> = {}
    for (const s of list) {
      initQty[s.item_id] = s.suggested_qty
    }
    setQuantities(initQty)
  }

  const displayed = showAll ? suggestions : suggestions.filter((s) => s.should_reorder)

  // Group by vendor
  function groupByVendor(list: ReorderSuggestion[]) {
    const groups: Record<string, { vendorName: string; vendorEmail: string | null; repName?: string | null; items: ReorderSuggestion[] }> = {}
    for (const s of list) {
      const key = s.vendor_id ?? '__unassigned__'
      if (!groups[key]) {
        groups[key] = {
          vendorName: s.vendor_name ?? 'Unassigned',
          vendorEmail: s.vendor_email,
          items: [],
        }
      }
      groups[key].items.push(s)
    }
    // Sort: assigned vendors first (alphabetically), unassigned last
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === '__unassigned__') return 1
      if (b === '__unassigned__') return -1
      return (groups[a].vendorName).localeCompare(groups[b].vendorName)
    })
  }

  function buildOrderText(vendorKey: string, group: { vendorName: string; vendorEmail: string | null; items: ReorderSuggestion[] }) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const lines = group.items
      .filter((s) => (quantities[s.item_id] ?? s.suggested_qty) > 0)
      .map((s) => `- ${s.item_name} x ${quantities[s.item_id] ?? s.suggested_qty} (${s.unit})`)
      .join('\n')

    return `TO: ${group.vendorName}${group.vendorEmail ? ` <${group.vendorEmail}>` : ''}
RE: Purchase Order - ${businessName || 'My Bar'}
DATE: ${today}

Please send the following items:

${lines}

Thank you,
${businessName || 'My Bar'}`
  }

  async function copyOrder(vendorKey: string, group: { vendorName: string; vendorEmail: string | null; items: ReorderSuggestion[] }) {
    const text = buildOrderText(vendorKey, group)
    await navigator.clipboard.writeText(text)
    setCopiedVendor(vendorKey)
    setTimeout(() => setCopiedVendor(null), 2000)
  }

  const grouped = groupByVendor(displayed)
  const totalReorder = suggestions.filter((s) => s.should_reorder).length

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Smart Reorder</h1>
        <p className="text-slate-500 mt-1 text-sm">AI-powered reorder suggestions based on your current stock and sales velocity.</p>
      </div>

      {/* Analyze button */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={analyze}
          disabled={loading}
          className="px-5 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyzing…' : 'Analyze & Suggest'}
        </button>
        {loading && (
          <p className="text-slate-500 text-sm">AI is reviewing your inventory and sales data…</p>
        )}
        {hasRun && !loading && (
          <p className="text-slate-500 text-sm">
            {totalReorder > 0
              ? `${totalReorder} item${totalReorder !== 1 ? 's' : ''} need reordering`
              : 'All items are sufficiently stocked'}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* No relevant items notice */}
      {hasRun && !loading && suggestions.length === 0 && !error && (
        <div className="text-center py-16 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-3xl mb-3">⟳</p>
          <p className="text-sm text-slate-500">No items with vendors or reorder levels set.</p>
          <p className="text-xs text-slate-600 mt-1">Assign vendors and reorder levels to your inventory items to get suggestions.</p>
        </div>
      )}

      {/* Show all toggle */}
      {hasRun && !loading && suggestions.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showAll
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-transparent text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {showAll ? `Showing all ${suggestions.length} items` : `Show all (${suggestions.length - totalReorder} OK)`}
          </button>
          {!showAll && totalReorder === 0 && (
            <p className="text-slate-600 text-xs">No items need reordering right now.</p>
          )}
        </div>
      )}

      {/* Vendor groups */}
      {grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(([vendorKey, group]) => (
            <div key={vendorKey} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Vendor header */}
              <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {vendorKey === '__unassigned__' ? 'Unassigned' : group.vendorName}
                  </h3>
                  {group.vendorEmail && (
                    <p className="text-xs text-slate-600 mt-0.5">{group.vendorEmail}</p>
                  )}
                </div>
                <button
                  onClick={() => setOpenOrderVendor(openOrderVendor === vendorKey ? null : vendorKey)}
                  className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors shrink-0"
                >
                  {openOrderVendor === vendorKey ? 'Hide Order' : 'Generate Order'}
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-800/50">
                {group.items.map((s) => (
                  <div key={s.item_id} className="px-4 sm:px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="mt-1.5">
                          <PriorityDot priority={s.priority} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-slate-200">{s.item_name}</p>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1.5 py-0.5 bg-slate-800 rounded">
                              {PRIORITY_LABEL[s.priority]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {s.current_stock != null && (
                              <span className="text-xs text-slate-500">
                                {Math.round(s.current_stock * 10) / 10} {s.unit} in stock
                              </span>
                            )}
                            {s.avg_daily_usage > 0 && (
                              <span className="text-xs text-slate-600">
                                ~{s.avg_daily_usage.toFixed(1)}/{s.unit.includes('bottle') || s.unit === 'can' || s.unit === 'keg' ? 'day' : 'day'}
                              </span>
                            )}
                            {s.days_remaining != null && (
                              <span className={`text-xs font-medium ${
                                s.days_remaining < 2 ? 'text-red-400' :
                                s.days_remaining < 7 ? 'text-amber-400' : 'text-slate-500'
                              }`}>
                                {s.days_remaining < 1
                                  ? `${(s.days_remaining * 24).toFixed(0)}h left`
                                  : `${s.days_remaining.toFixed(1)} days left`}
                              </span>
                            )}
                          </div>
                          {s.reasoning && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.reasoning}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <label className="text-[10px] text-slate-600 uppercase tracking-wider">Order qty</label>
                        <input
                          type="number"
                          min="0"
                          value={quantities[s.item_id] ?? s.suggested_qty}
                          onChange={(e) => setQuantities((prev) => ({ ...prev, [s.item_id]: parseInt(e.target.value) || 0 }))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 text-right focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generated order */}
              {openOrderVendor === vendorKey && (
                <div className="border-t border-slate-800 bg-slate-950/60 px-4 sm:px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Order Draft</p>
                    <button
                      onClick={() => copyOrder(vendorKey, group)}
                      className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                      {copiedVendor === vendorKey ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap bg-slate-900 border border-slate-800 rounded-xl p-4 leading-relaxed">
                    {buildOrderText(vendorKey, group)}
                  </pre>
                  {vendorKey !== '__unassigned__' && (
                    <p className="text-[11px] text-slate-700">
                      When you get a domain, we&apos;ll send this directly via email.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
