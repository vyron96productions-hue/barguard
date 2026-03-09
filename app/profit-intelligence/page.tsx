'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DrinkProfitSummary } from '@/types'

type Period = '7d' | '30d' | 'month' | 'custom'
type SortKey = 'profit' | 'margin' | 'revenue' | 'volume'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getPresetRange(preset: Exclude<Period, 'custom'>): { start: string; end: string } {
  const today = new Date()
  const end = isoDate(today)
  if (preset === '7d') {
    const s = new Date(today); s.setDate(s.getDate() - 6)
    return { start: isoDate(s), end }
  }
  if (preset === '30d') {
    const s = new Date(today); s.setDate(s.getDate() - 29)
    return { start: isoDate(s), end }
  }
  // month
  return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProfitIntelligencePage() {
  const [activePeriod, setActivePeriod] = useState<Period>('7d')
  const [periodStart, setPeriodStart]   = useState(() => getPresetRange('7d').start)
  const [periodEnd, setPeriodEnd]       = useState(() => isoDate(new Date()))
  const [summaries, setSummaries]       = useState<DrinkProfitSummary[]>([])
  const [loading, setLoading]           = useState(false)
  const [calculating, setCalculating]   = useState(false)
  const [hasData, setHasData]           = useState(false)
  const [lastCalcAt, setLastCalcAt]     = useState<string | null>(null)
  const [sortBy, setSortBy]             = useState<SortKey>('profit')

  // Sync dates when preset changes
  useEffect(() => {
    if (activePeriod === 'custom') return
    const { start, end } = getPresetRange(activePeriod)
    setPeriodStart(start)
    setPeriodEnd(end)
  }, [activePeriod])

  const loadSummaries = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reports/profit?period_start=${periodStart}&period_end=${periodEnd}`)
    const data = await res.json()
    const rows: DrinkProfitSummary[] = Array.isArray(data) ? data : []
    setSummaries(rows)
    setHasData(rows.length > 0)
    setLoading(false)
  }, [periodStart, periodEnd])

  useEffect(() => { loadSummaries() }, [loadSummaries])

  async function runCalculation() {
    setCalculating(true)
    await fetch('/api/calculations/profit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
    })
    await loadSummaries()
    setLastCalcAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    setCalculating(false)
  }

  // Aggregate KPIs
  const totalRevenue = summaries.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const totalCost    = summaries.reduce((s, r) => s + (r.estimated_cost ?? 0), 0)
  const totalProfit  = totalRevenue - totalCost
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null

  // Sort
  const sorted = [...summaries].sort((a, b) => {
    if (sortBy === 'profit')  return (b.estimated_profit ?? -Infinity) - (a.estimated_profit ?? -Infinity)
    if (sortBy === 'margin')  return (b.profit_margin_pct ?? -Infinity) - (a.profit_margin_pct ?? -Infinity)
    if (sortBy === 'revenue') return (b.gross_revenue ?? 0) - (a.gross_revenue ?? 0)
    return b.quantity_sold - a.quantity_sold // volume
  })
  const topDrink = sorted[0] ?? null

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'profit',  label: 'Profit' },
    { key: 'margin',  label: 'Margin' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'volume',  label: 'Volume' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Profit Intelligence</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
              Manager
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Drink-level cost, margin, and profit — ranked by what's earning most.
          </p>
        </div>
        {lastCalcAt && (
          <p className="text-xs text-slate-700 self-end">Calculated at {lastCalcAt}</p>
        )}
      </div>

      {/* Period selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        {/* Preset pills */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {([
            { key: '7d',    label: 'Last 7 Days' },
            { key: '30d',   label: 'Last 30 Days' },
            { key: 'month', label: 'This Month' },
            { key: 'custom', label: 'Custom' },
          ] as { key: Period; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActivePeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activePeriod === key
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date inputs — always visible, light when preset is active */}
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex gap-2 flex-1">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-600 mb-1 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => { setPeriodStart(e.target.value); setActivePeriod('custom') }}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 transition-colors ${
                  activePeriod === 'custom' ? 'border-slate-600 text-slate-200' : 'border-slate-800 text-slate-500'
                }`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-slate-600 mb-1 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => { setPeriodEnd(e.target.value); setActivePeriod('custom') }}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 transition-colors ${
                  activePeriod === 'custom' ? 'border-slate-600 text-slate-200' : 'border-slate-800 text-slate-500'
                }`}
              />
            </div>
          </div>
          <button
            onClick={runCalculation}
            disabled={calculating}
            className="shrink-0 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {calculating ? 'Calculating…' : hasData ? 'Recalculate' : 'Calculate Profit'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <p className="text-slate-600 text-sm">Loading…</p>}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-500 text-lg">◑</span>
          </div>
          <p className="text-slate-300 font-semibold">No profit data for this period</p>
          <p className="text-slate-600 text-sm mt-1 max-w-xs mx-auto">
            Add cost per oz to your inventory items, then click Calculate.
          </p>
          <a href="/inventory-items" className="inline-block mt-4 text-sm text-amber-400 hover:underline">
            Set item costs →
          </a>
        </div>
      )}

      {/* Results */}
      {!loading && hasData && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} />
            <KpiCard label="Est. Cost" value={`$${totalCost.toFixed(0)}`} muted />
            <KpiCard
              label="Est. Profit"
              value={`$${totalProfit.toFixed(0)}`}
              accent={totalProfit > 0 ? 'emerald' : 'red'}
            />
            <KpiCard
              label="Avg Margin"
              value={overallMargin != null ? `${overallMargin.toFixed(1)}%` : '—'}
              accent={overallMargin != null ? (overallMargin >= 65 ? 'emerald' : overallMargin >= 45 ? 'amber' : 'red') : undefined}
            />
          </div>

          {/* Top earner spotlight */}
          {topDrink?.estimated_profit != null && (
            <div className="flex items-center gap-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <span className="text-amber-400 text-sm">★</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-400">{topDrink.menu_item?.name ?? 'Unknown'}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Top earner for {fmtDate(periodStart)}–{fmtDate(periodEnd)}
                  {' · '}${topDrink.estimated_profit.toFixed(0)} profit
                  {' · '}{topDrink.quantity_sold} sold
                  {topDrink.profit_margin_pct != null && ` · ${topDrink.profit_margin_pct.toFixed(0)}% margin`}
                </p>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div>
            {/* Leaderboard header */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em]">
                Profit Leaderboard
              </p>
              <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <span className="text-[9px] text-slate-700 px-2 uppercase tracking-wider">Sort</span>
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      sortBy === key ? 'bg-slate-700 text-slate-200' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_3.5rem_5rem_5.5rem_5rem] gap-0 px-5 py-2.5 border-b border-slate-800 bg-slate-800/30">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Drink</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Sold</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Revenue</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Est. Profit</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Margin</p>
              </div>
              {sorted.map((row, i) => (
                <div
                  key={row.id ?? i}
                  className="grid grid-cols-[1fr_3.5rem_5rem_5.5rem_5rem] gap-0 px-5 py-3.5 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors items-center"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-slate-200 truncate">{row.menu_item?.name ?? '—'}</p>
                    {!row.has_full_cost && (
                      <p className="text-[10px] text-amber-500/50 mt-0.5">partial cost data</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 tabular-nums text-right">{row.quantity_sold}</p>
                  <p className="text-sm text-slate-400 tabular-nums text-right">${(row.gross_revenue ?? 0).toFixed(0)}</p>
                  <p className={`text-sm font-semibold tabular-nums text-right ${
                    row.estimated_profit == null ? 'text-slate-700'
                      : row.estimated_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {row.estimated_profit != null ? `$${row.estimated_profit.toFixed(0)}` : '—'}
                  </p>
                  <div className="text-right">
                    {row.profit_margin_pct != null
                      ? <MarginBadge margin={row.profit_margin_pct} />
                      : <span className="text-slate-700 text-sm">—</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {sorted.map((row, i) => (
                <div
                  key={row.id ?? i}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{row.menu_item?.name ?? '—'}</p>
                      {!row.has_full_cost && (
                        <p className="text-[10px] text-amber-500/50 mt-0.5">partial cost data</p>
                      )}
                    </div>
                    {row.profit_margin_pct != null && <MarginBadge margin={row.profit_margin_pct} />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Revenue</p>
                      <p className="text-sm text-slate-300 tabular-nums mt-0.5">${(row.gross_revenue ?? 0).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Profit</p>
                      <p className={`text-sm font-semibold tabular-nums mt-0.5 ${
                        row.estimated_profit == null ? 'text-slate-700'
                          : row.estimated_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {row.estimated_profit != null ? `$${row.estimated_profit.toFixed(0)}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Sold</p>
                      <p className="text-sm text-slate-400 tabular-nums mt-0.5">{row.quantity_sold}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, muted, accent }: {
  label: string
  value: string
  muted?: boolean
  accent?: 'emerald' | 'amber' | 'red'
}) {
  const valueColor = muted
    ? 'text-slate-600'
    : accent === 'emerald' ? 'text-emerald-400'
    : accent === 'amber'   ? 'text-amber-400'
    : accent === 'red'     ? 'text-red-400'
    : 'text-slate-100'

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3.5">
      <p className={`text-2xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  )
}

function MarginBadge({ margin }: { margin: number }) {
  const cls = margin >= 70
    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    : margin >= 50
    ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border tabular-nums ${cls}`}>
      {margin.toFixed(0)}%
    </span>
  )
}
