'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DrinkProfitSummary } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)
const WEEK_AGO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export default function ProfitIntelligencePage() {
  const [periodStart, setPeriodStart] = useState(WEEK_AGO)
  const [periodEnd, setPeriodEnd] = useState(TODAY)
  const [summaries, setSummaries] = useState<DrinkProfitSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [hasData, setHasData] = useState(false)

  const loadSummaries = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reports/profit?period_start=${periodStart}&period_end=${periodEnd}`)
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
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
    setCalculating(false)
  }

  // Aggregate KPIs
  const totalRevenue = summaries.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const totalCost = summaries.reduce((s, r) => s + (r.estimated_cost ?? 0), 0)
  const totalProfit = totalRevenue - totalCost
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
  const topDrink = summaries[0] ?? null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Profit Intelligence</h1>
          <p className="text-gray-500 mt-1 text-sm">Drink-level cost, margin, and profit analysis.</p>
        </div>
      </div>

      {/* Date range + calculate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex gap-3 flex-1">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>
        <button
          onClick={runCalculation}
          disabled={calculating}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
        >
          {calculating ? 'Calculating…' : hasData ? 'Recalculate' : 'Calculate Profit'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : !hasData ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-slate-300 font-medium">No profit data yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Make sure inventory items have a cost per oz, then click Calculate Profit.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <a href="/inventory-items" className="text-sm text-amber-400 hover:underline">Set item costs →</a>
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} />
            <KpiCard label="Est. Cost" value={`$${totalCost.toFixed(0)}`} dimmed />
            <KpiCard label="Est. Profit" value={`$${totalProfit.toFixed(0)}`} highlight={totalProfit > 0} />
            <KpiCard
              label="Avg Margin"
              value={overallMargin != null ? `${overallMargin.toFixed(1)}%` : '—'}
              highlight={overallMargin != null && overallMargin > 60}
            />
          </div>

          {/* Top drink callout */}
          {topDrink && topDrink.estimated_profit != null && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-amber-400 text-lg">★</span>
              <div>
                <p className="text-sm font-semibold text-amber-400">{topDrink.menu_item?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">
                  Top earner · ${topDrink.estimated_profit.toFixed(2)} profit · {topDrink.quantity_sold} sold
                  {topDrink.profit_margin_pct != null && ` · ${topDrink.profit_margin_pct.toFixed(1)}% margin`}
                </p>
              </div>
            </div>
          )}

          {/* Profit leaderboard */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profit Leaderboard</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b border-gray-800 bg-gray-800/40">
                <p className="text-xs text-gray-600">Drink</p>
                <p className="text-xs text-gray-600 text-right">Sold</p>
                <p className="text-xs text-gray-600 text-right">Revenue</p>
                <p className="text-xs text-gray-600 text-right">Est. Profit</p>
                <p className="text-xs text-gray-600 text-right">Margin</p>
              </div>

              {summaries.map((row, i) => {
                const name = row.menu_item?.name ?? 'Unknown'
                const profit = row.estimated_profit
                const margin = row.profit_margin_pct

                return (
                  <div
                    key={row.id ?? i}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition-colors items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{name}</p>
                      {!row.has_full_cost && (
                        <p className="text-[10px] text-amber-500/60 mt-0.5">partial cost data</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 tabular-nums text-right">{row.quantity_sold}</p>
                    <p className="text-sm text-gray-300 tabular-nums text-right">
                      ${(row.gross_revenue ?? 0).toFixed(0)}
                    </p>
                    <p className={`text-sm font-medium tabular-nums text-right ${
                      profit == null ? 'text-gray-600' : profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {profit != null ? `$${profit.toFixed(0)}` : '—'}
                    </p>
                    <div className="text-right">
                      {margin != null ? (
                        <MarginBadge margin={margin} />
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, dimmed, highlight }: {
  label: string
  value: string
  dimmed?: boolean
  highlight?: boolean
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <p className={`text-2xl font-bold tabular-nums leading-none ${
        highlight ? 'text-emerald-400' : dimmed ? 'text-gray-600' : 'text-gray-100'
      }`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  )
}

function MarginBadge({ margin }: { margin: number }) {
  const color = margin >= 70
    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    : margin >= 50
    ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'

  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded border ${color}`}>
      {margin.toFixed(1)}%
    </span>
  )
}
