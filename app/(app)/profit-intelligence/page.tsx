'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DrinkProfitSummary } from '@/types'

type Period  = '7d' | '30d' | 'month' | 'custom'
type SortKey = 'profit' | 'margin' | 'revenue' | 'volume'

function isoDate(d: Date) { return d.toLocaleDateString('en-CA') }

function getPresetRange(p: Exclude<Period, 'custom'>) {
  const today = new Date(); const end = isoDate(today)
  if (p === '7d')    { const s = new Date(today); s.setDate(s.getDate() - 6);  return { start: isoDate(s), end } }
  if (p === '30d')   { const s = new Date(today); s.setDate(s.getDate() - 29); return { start: isoDate(s), end } }
  return { start: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDollar(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`
}

function isDrinkRow(s: DrinkProfitSummary) { return s.menu_item?.item_type !== 'food' }
function isFoodRow(s: DrinkProfitSummary)  { return s.menu_item?.item_type === 'food' }

function catStats(rows: DrinkProfitSummary[]) {
  const revenue = rows.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const cost    = rows.reduce((s, r) => s + (r.estimated_cost ?? 0), 0)
  const profit  = revenue - cost
  const margin  = revenue > 0 ? (profit / revenue) * 100 : null
  const volume  = rows.reduce((s, r) => s + r.quantity_sold, 0)
  const hasPartial = rows.some(r => !r.has_full_cost)
  return { revenue, cost, profit, margin, volume, hasPartial }
}

// Simple markdown renderer for AI insights
function InsightText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <p key={i} className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em] pt-4 first:pt-0">
              {line.slice(3)}
            </p>
          )
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <p key={i} className="text-sm text-slate-400 leading-relaxed flex gap-2">
              <span className="text-slate-700 shrink-0 mt-0.5">·</span>
              <span>{line.slice(2)}</span>
            </p>
          )
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <p key={i} className="text-sm text-slate-400 leading-relaxed flex gap-2">
              <span className="text-slate-600 shrink-0 tabular-nums">{line.match(/^(\d+\.)/)?.[1]}</span>
              <span>{line.replace(/^\d+\.\s/, '')}</span>
            </p>
          )
        }
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-slate-400 leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export default function ProfitIntelligencePage() {
  const [activePeriod, setActivePeriod] = useState<Period>('7d')
  const [periodStart, setPeriodStart]   = useState(() => getPresetRange('7d').start)
  const [periodEnd,   setPeriodEnd]     = useState(() => isoDate(new Date()))
  const [allSummaries, setAllSummaries] = useState<DrinkProfitSummary[]>([])
  const [typeFilter,  setTypeFilter]    = useState<'all' | 'drink' | 'food'>('all')
  const [loading,     setLoading]       = useState(false)
  const [calculating, setCalculating]   = useState(false)
  const [calcError,   setCalcError]     = useState<string | null>(null)
  const [hasData,     setHasData]       = useState(false)
  const [lastCalcAt,  setLastCalcAt]    = useState<string | null>(null)
  const [sortBy,      setSortBy]        = useState<SortKey>('profit')

  // AI insights
  const [insight,           setInsight]           = useState<string | null>(null)
  const [insightLoading,    setInsightLoading]    = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [insightError,      setInsightError]      = useState<string | null>(null)

  // Sync dates with preset
  useEffect(() => {
    if (activePeriod === 'custom') return
    const { start, end } = getPresetRange(activePeriod)
    setPeriodStart(start); setPeriodEnd(end)
  }, [activePeriod])

  // Calculate profit then fetch summaries — always runs fresh so it stays in sync with sales
  const loadSummaries = useCallback(async () => {
    setCalculating(true)
    setLoading(true)
    setCalcError(null)
    setInsight(null)
    try {
      await fetch('/api/calculations/profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
      })
      const res = await fetch(`/api/reports/profit?period_start=${periodStart}&period_end=${periodEnd}`)
      if (!res.ok) { setCalcError('Failed to load profit data — please try again'); setCalculating(false); setLoading(false); return }
      const data = await res.json()
      const rows: DrinkProfitSummary[] = Array.isArray(data) ? data : []
      setAllSummaries(rows)
      setHasData(rows.length > 0)
      setLastCalcAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    } catch {
      setCalcError('Network error — please try again')
    }
    setCalculating(false)
    setLoading(false)
  }, [periodStart, periodEnd])

  // Filtered summaries for the main dashboard (respects typeFilter)
  const summaries = typeFilter === 'all'
    ? allSummaries
    : typeFilter === 'food'
      ? allSummaries.filter(isFoodRow)
      : allSummaries.filter(isDrinkRow)

  // Category splits — always from full dataset
  const drinkRows = allSummaries.filter(isDrinkRow)
  const foodRows  = allSummaries.filter(isFoodRow)
  const showCategorySplit = typeFilter === 'all' && drinkRows.length > 0 && foodRows.length > 0

  useEffect(() => { loadSummaries() }, [loadSummaries])

  // Fetch cached AI insight when period or data changes
  const loadInsight = useCallback(async () => {
    setInsight(null); setInsightError(null); setInsightLoading(true)
    const res = await fetch(`/api/ai/profit-insights?period_start=${periodStart}&period_end=${periodEnd}`)
    const data = await res.json()
    setInsight(data?.summary_text ?? null)
    setInsightLoading(false)
  }, [periodStart, periodEnd])

  useEffect(() => { if (hasData) loadInsight() }, [hasData, loadInsight])

  async function runCalculation() {
    await loadSummaries()
  }

  async function generateInsight() {
    setGeneratingInsight(true); setInsightError(null)
    const res = await fetch('/api/ai/profit-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd, summaries }),
    })
    const data = await res.json()
    if (!res.ok) { setInsightError(data.error ?? 'Generation failed'); setGeneratingInsight(false); return }
    setInsight(data.summary_text)
    setGeneratingInsight(false)
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const totalRevenue  = summaries.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const totalCost     = summaries.reduce((s, r) => s + (r.estimated_cost ?? 0), 0)
  const totalProfit   = totalRevenue - totalCost
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
  const maxRevenue    = Math.max(...summaries.map((r) => r.gross_revenue ?? 0), 1)

  const sorted = [...summaries].sort((a, b) => {
    if (sortBy === 'profit')  return (b.estimated_profit  ?? -Infinity) - (a.estimated_profit  ?? -Infinity)
    if (sortBy === 'margin')  return (b.profit_margin_pct ?? -Infinity) - (a.profit_margin_pct ?? -Infinity)
    if (sortBy === 'revenue') return (b.gross_revenue ?? 0) - (a.gross_revenue ?? 0)
    return b.quantity_sold - a.quantity_sold
  })

  const topProfit    = [...summaries].filter(r => r.estimated_profit != null)
                         .sort((a, b) => (b.estimated_profit ?? 0) - (a.estimated_profit ?? 0))[0] ?? null
  const topRevenue   = [...summaries].sort((a, b) => (b.gross_revenue ?? 0) - (a.gross_revenue ?? 0))[0] ?? null
  const lowestMargin = [...summaries]
    .filter(r => r.has_full_cost && r.profit_margin_pct != null && r.quantity_sold > 0)
    .sort((a, b) => (a.profit_margin_pct ?? 100) - (b.profit_margin_pct ?? 100))[0] ?? null

  const PERIOD_PRESETS: { key: Period; label: string }[] = [
    { key: '7d', label: 'Last 7 Days' }, { key: '30d', label: 'Last 30 Days' },
    { key: 'month', label: 'This Month' }, { key: 'custom', label: 'Custom' },
  ]
  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'profit', label: 'Profit' }, { key: 'margin', label: 'Margin' },
    { key: 'revenue', label: 'Revenue' }, { key: 'volume', label: 'Volume' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Profit Intelligence</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
              Manager
            </span>
          </div>
          <p className="text-slate-500 text-sm">Menu-wide cost, margin, and profit for {fmtDate(periodStart)}–{fmtDate(periodEnd)}.</p>
        </div>
        {lastCalcAt && (
          <p className="text-xs text-slate-700 pb-0.5">Updated {lastCalcAt}</p>
        )}
      </div>

      {/* ── View filter ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
        {(['all', 'drink', 'food'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              typeFilter === t ? 'bg-amber-500 text-slate-900' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'all' ? 'All Items' : t === 'drink' ? 'Drinks' : 'Food'}
          </button>
        ))}
      </div>

      {/* ── Period selector ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {PERIOD_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActivePeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activePeriod === key
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex gap-2 flex-1">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-600 mb-1 uppercase tracking-wider">From</label>
              <input type="date" value={periodStart}
                onChange={(e) => { setPeriodStart(e.target.value); setActivePeriod('custom') }}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 transition-colors ${activePeriod === 'custom' ? 'border-slate-600 text-slate-200' : 'border-slate-800 text-slate-500'}`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-slate-600 mb-1 uppercase tracking-wider">To</label>
              <input type="date" value={periodEnd}
                onChange={(e) => { setPeriodEnd(e.target.value); setActivePeriod('custom') }}
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/60 transition-colors ${activePeriod === 'custom' ? 'border-slate-600 text-slate-200' : 'border-slate-800 text-slate-500'}`}
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

      {loading && <p className="text-slate-600 text-sm">Loading…</p>}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {!loading && calcError && (
        <div className="text-center py-12 border border-red-900/40 border-dashed rounded-2xl">
          <p className="text-sm text-red-400 mb-3">{calcError}</p>
          <button onClick={loadSummaries} className="text-xs text-slate-500 hover:text-slate-300 underline">Retry</button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && !calcError && !hasData && (
        <div className="bg-slate-900/40 border border-slate-800/60 border-dashed rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-500 text-lg">◑</span>
          </div>
          <p className="text-slate-300 font-semibold">No profit data for this period</p>
          <p className="text-slate-600 text-sm mt-1 max-w-xs mx-auto">
            Set a cost per unit on your inventory items, then click Calculate Profit.
          </p>
          <a href="/inventory-items" className="inline-block mt-4 text-sm text-amber-400 hover:underline">
            Set item costs →
          </a>
        </div>
      )}

      {/* ── Dashboard ───────────────────────────────────────────────────────── */}
      {!loading && hasData && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile label="Revenue"    value={fmtDollar(totalRevenue)} />
            <KpiTile label="Est. Cost"  value={fmtDollar(totalCost)}   muted />
            <KpiTile label="Est. Profit" value={fmtDollar(totalProfit)}
              accent={totalProfit >= 0 ? 'emerald' : 'red'} />
            <KpiTile label="Avg Margin"
              value={overallMargin != null ? `${overallMargin.toFixed(1)}%` : '—'}
              accent={overallMargin == null ? undefined : overallMargin >= 65 ? 'emerald' : overallMargin >= 45 ? 'amber' : 'red'}
            />
          </div>

          {/* ── Category breakdown — only when both types present ───────────── */}
          {showCategorySplit && (
            <CategorySplitPanel drinkRows={drinkRows} foodRows={foodRows} />
          )}

          {/* Spotlight triptych */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SpotlightCard
              icon="★"
              accentClass="border-emerald-500/20 bg-emerald-500/[0.04]"
              iconClass="bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
              labelClass="text-emerald-500/60"
              label="Top Profit Item"
              name={topProfit?.menu_item?.name ?? '—'}
              primary={topProfit?.estimated_profit != null ? fmtDollar(topProfit.estimated_profit) + ' profit' : '—'}
              secondary={[
                topProfit?.profit_margin_pct != null ? `${topProfit.profit_margin_pct.toFixed(0)}% margin` : null,
                topProfit ? `${topProfit.quantity_sold} sold` : null,
              ].filter(Boolean).join(' · ')}
            />
            <SpotlightCard
              icon="↑"
              accentClass="border-amber-500/20 bg-amber-500/[0.04]"
              iconClass="bg-amber-500/15 border-amber-500/25 text-amber-400"
              labelClass="text-amber-500/60"
              label="Top Revenue Driver"
              name={topRevenue?.menu_item?.name ?? '—'}
              primary={topRevenue?.gross_revenue != null ? fmtDollar(topRevenue.gross_revenue) + ' revenue' : '—'}
              secondary={[
                topRevenue ? `${topRevenue.quantity_sold} sold` : null,
                topRevenue?.profit_margin_pct != null ? `${topRevenue.profit_margin_pct.toFixed(0)}% margin` : null,
              ].filter(Boolean).join(' · ')}
            />
            <SpotlightCard
              icon="↓"
              accentClass={lowestMargin ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-slate-800 bg-transparent'}
              iconClass={lowestMargin ? 'bg-red-500/15 border-red-500/25 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-600'}
              labelClass="text-red-500/60"
              label="Lowest Margin Item"
              name={lowestMargin?.menu_item?.name ?? '—'}
              primary={lowestMargin?.profit_margin_pct != null ? `${lowestMargin.profit_margin_pct.toFixed(0)}% margin` : '—'}
              secondary={[
                lowestMargin?.estimated_cost != null && lowestMargin.quantity_sold > 0
                  ? `$${(lowestMargin.estimated_cost / lowestMargin.quantity_sold).toFixed(2)}/item cost`
                  : null,
                lowestMargin ? `${lowestMargin.quantity_sold} sold` : null,
              ].filter(Boolean).join(' · ')}
              dimmed={!lowestMargin}
            />
          </div>

          {/* Revenue vs Profit visual */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex-1">Revenue vs Profit</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-700" />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" />Profit</span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[...summaries]
                .sort((a, b) => (b.gross_revenue ?? 0) - (a.gross_revenue ?? 0))
                .map((row, i) => {
                  const rev  = row.gross_revenue ?? 0
                  const prof = Math.max(0, row.estimated_profit ?? 0)
                  const revPct  = (rev  / maxRevenue) * 100
                  const profPct = (prof / maxRevenue) * 100
                  const isFood  = row.menu_item?.item_type === 'food'

                  return (
                    <div key={row.id ?? i} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-32 shrink-0 min-w-0">
                        <p className="text-xs text-slate-500 truncate flex-1">{row.menu_item?.name ?? '—'}</p>
                        {isFood && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400/70 font-medium shrink-0 leading-none">f</span>
                        )}
                      </div>
                      <div className="flex-1 relative h-5 flex items-center">
                        <div className="absolute inset-y-0 left-0 rounded bg-slate-700/60" style={{ width: `${revPct}%` }} />
                        <div className="absolute inset-y-0 left-0 rounded bg-emerald-500/55" style={{ width: `${profPct}%` }} />
                      </div>
                      <div className="text-right w-24 shrink-0 flex items-center justify-end gap-2">
                        <p className="text-xs font-semibold text-emerald-400 tabular-nums">
                          {row.estimated_profit != null ? fmtDollar(row.estimated_profit) : '—'}
                        </p>
                        {row.profit_margin_pct != null && (
                          <p className="text-[10px] text-slate-600 tabular-nums w-8 text-right">
                            {row.profit_margin_pct.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>

          {/* ── Category Top Lists — only when both types present ───────────── */}
          {showCategorySplit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CategoryTopList label="Top Drinks" rows={drinkRows} accent="amber" />
              <CategoryTopList label="Top Food"   rows={foodRows}  accent="orange" />
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 0v2m0 8v2M2 8h2m8 0h2" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AI Profit Insights</p>
              </div>
              {insight && !generatingInsight && (
                <button onClick={generateInsight} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                  Regenerate
                </button>
              )}
            </div>

            <div className="px-5 py-5">
              {insightLoading ? (
                <p className="text-slate-600 text-sm">Loading…</p>
              ) : generatingInsight ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500/40 border-t-amber-500 animate-spin shrink-0" />
                  <p className="text-slate-500 text-sm">Analyzing {summaries.length} items…</p>
                </div>
              ) : insight ? (
                <InsightText text={insight} />
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Generate AI insights for this period</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Analyzes your {summaries.length} menu items — top performers, margin gaps, and recommendations.
                    </p>
                  </div>
                  <button
                    onClick={generateInsight}
                    className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Generate Insights
                  </button>
                </div>
              )}
              {insightError && <p className="text-red-400 text-xs mt-3">{insightError}</p>}
            </div>
          </div>

          {/* Profit Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em]">Profit Leaderboard</p>
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
              <div className="grid grid-cols-[1fr_3.5rem_5rem_5.5rem_5rem] px-5 py-2.5 border-b border-slate-800 bg-slate-800/30">
                {['Item','Sold','Revenue','Est. Profit','Margin'].map((h, i) => (
                  <p key={h} className={`text-[10px] text-slate-600 uppercase tracking-wider ${i > 0 ? 'text-right' : ''}`}>{h}</p>
                ))}
              </div>
              {sorted.map((row, i) => (
                <div
                  key={row.id ?? i}
                  className="grid grid-cols-[1fr_3.5rem_5rem_5.5rem_5rem] px-5 py-3.5 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors items-center"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200 truncate">{row.menu_item?.name ?? '—'}</p>
                      {row.menu_item?.item_type === 'food' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400/80 font-medium shrink-0">food</span>
                      )}
                    </div>
                    {!row.has_full_cost && (
                      <p className="text-[10px] text-amber-500/40 mt-0.5">partial cost data</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 tabular-nums text-right">{row.quantity_sold}</p>
                  <p className="text-sm text-slate-400 tabular-nums text-right">{fmtDollar(row.gross_revenue ?? 0)}</p>
                  <p className={`text-sm font-semibold tabular-nums text-right ${
                    row.estimated_profit == null ? 'text-slate-700'
                      : row.estimated_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {row.estimated_profit != null ? fmtDollar(row.estimated_profit) : '—'}
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
                <div key={row.id ?? i} className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-200">{row.menu_item?.name ?? '—'}</p>
                        {row.menu_item?.item_type === 'food' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400/80 font-medium shrink-0">food</span>
                        )}
                      </div>
                      {!row.has_full_cost && <p className="text-[10px] text-amber-500/40 mt-0.5">partial cost data</p>}
                    </div>
                    {row.profit_margin_pct != null && <MarginBadge margin={row.profit_margin_pct} />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Revenue', value: fmtDollar(row.gross_revenue ?? 0), color: 'text-slate-300' },
                      { label: 'Profit',  value: row.estimated_profit != null ? fmtDollar(row.estimated_profit) : '—',
                        color: row.estimated_profit == null ? 'text-slate-700' : row.estimated_profit >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold' },
                      { label: 'Sold',    value: String(row.quantity_sold), color: 'text-slate-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</p>
                        <p className={`text-sm tabular-nums mt-0.5 ${color}`}>{value}</p>
                      </div>
                    ))}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiTile({ label, value, muted, accent }: {
  label: string; value: string; muted?: boolean
  accent?: 'emerald' | 'amber' | 'red'
}) {
  const color = muted ? 'text-slate-600'
    : accent === 'emerald' ? 'text-emerald-400'
    : accent === 'amber'   ? 'text-amber-400'
    : accent === 'red'     ? 'text-red-400'
    : 'text-slate-100'
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3.5">
      <p className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  )
}

function SpotlightCard({ icon, accentClass, iconClass, labelClass, label, name, primary, secondary, dimmed }: {
  icon: string; accentClass: string; iconClass: string; labelClass: string
  label: string; name: string; primary: string; secondary: string; dimmed?: boolean
}) {
  return (
    <div className={`border rounded-2xl p-4 ${accentClass}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${labelClass}`}>{label}</p>
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-xs ${iconClass}`}>
          {icon}
        </div>
      </div>
      <p className={`text-base font-bold leading-snug mb-1 ${dimmed ? 'text-slate-600' : 'text-slate-100'}`}>{name}</p>
      <p className={`text-sm font-semibold tabular-nums ${dimmed ? 'text-slate-700' : 'text-slate-300'}`}>{primary}</p>
      {secondary && (
        <p className="text-xs text-slate-600 mt-1">{secondary}</p>
      )}
    </div>
  )
}

function MarginBadge({ margin }: { margin: number }) {
  const cls = margin >= 70 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    : margin >= 50 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border tabular-nums ${cls}`}>
      {margin.toFixed(0)}%
    </span>
  )
}

// ── Category Split Panel ───────────────────────────────────────────────────────

function StatRow({ label, value, accent }: {
  label: string; value: string; accent?: 'emerald' | 'amber' | 'red'
}) {
  const color = accent === 'emerald' ? 'text-emerald-400'
    : accent === 'amber' ? 'text-amber-400'
    : accent === 'red' ? 'text-red-400'
    : 'text-slate-200'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-xs text-slate-600 shrink-0">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function CategorySplitPanel({
  drinkRows, foodRows,
}: {
  drinkRows: DrinkProfitSummary[]
  foodRows:  DrinkProfitSummary[]
}) {
  const ds = catStats(drinkRows)
  const fs = catStats(foodRows)
  const totalRev = ds.revenue + fs.revenue
  const drinkRevPct = totalRev > 0 ? (ds.revenue / totalRev) * 100 : 50
  const foodRevPct  = 100 - drinkRevPct

  const totalProfit = ds.profit + fs.profit
  const drinkProfitPct = totalProfit > 0 ? (ds.profit / totalProfit) * 100 : 50
  const foodProfitPct  = 100 - drinkProfitPct

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center gap-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex-1">Category Breakdown</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400/70 shrink-0" />Drinks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-orange-400/70 shrink-0" />Food
          </span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Split bars */}
        <div className="space-y-3">
          {/* Revenue split */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1.5">
              <span>Revenue</span>
              <span className="tabular-nums">{fmtDollar(totalRev)} total</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-800">
              <div
                className="bg-amber-400/70 h-full transition-all duration-500 rounded-l-full"
                style={{ width: `${drinkRevPct}%` }}
              />
              <div className="bg-orange-400/70 h-full flex-1 rounded-r-full" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 tabular-nums">{drinkRevPct.toFixed(0)}%</span>
              <span className="text-[10px] text-slate-500 tabular-nums">{foodRevPct.toFixed(0)}%</span>
            </div>
          </div>

          {/* Profit split */}
          {(ds.profit > 0 || fs.profit > 0) && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1.5">
                <span>Profit</span>
                <span className="tabular-nums">{fmtDollar(totalProfit)} total</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-800">
                <div
                  className="bg-amber-400/40 h-full transition-all duration-500 rounded-l-full"
                  style={{ width: `${Math.max(0, drinkProfitPct)}%` }}
                />
                <div className="bg-orange-400/40 h-full flex-1 rounded-r-full" />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-600 tabular-nums">{drinkProfitPct.toFixed(0)}%</span>
                <span className="text-[10px] text-slate-600 tabular-nums">{foodProfitPct.toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Two-column stats */}
        <div className="grid grid-cols-2 gap-0 border border-slate-800 rounded-xl overflow-hidden">
          {/* Drinks column */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-sm bg-amber-400/70 shrink-0" />
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Drinks · {drinkRows.length}
              </p>
            </div>
            <StatRow label="Revenue"    value={fmtDollar(ds.revenue)} />
            <StatRow label="Est. Profit" value={fmtDollar(ds.profit)}
              accent={ds.profit >= 0 ? 'emerald' : 'red'} />
            <StatRow label="Avg Margin"  value={ds.margin != null ? `${ds.margin.toFixed(1)}%` : '—'}
              accent={ds.margin == null ? undefined : ds.margin >= 65 ? 'emerald' : ds.margin >= 45 ? 'amber' : 'red'} />
            <StatRow label="Items Sold" value={ds.volume.toLocaleString()} />
          </div>

          {/* Food column */}
          <div className="p-4 space-y-2.5 border-l border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-sm bg-orange-400/70 shrink-0" />
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Food · {foodRows.length}
              </p>
            </div>
            <StatRow label="Revenue"    value={fmtDollar(fs.revenue)} />
            <StatRow label="Est. Profit" value={fmtDollar(fs.profit)}
              accent={fs.profit >= 0 ? 'emerald' : 'red'} />
            <StatRow label="Avg Margin"  value={fs.margin != null ? `${fs.margin.toFixed(1)}%` : '—'}
              accent={fs.margin == null ? undefined : fs.margin >= 65 ? 'emerald' : fs.margin >= 45 ? 'amber' : 'red'} />
            <StatRow label="Items Sold" value={fs.volume.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Category Top Lists ─────────────────────────────────────────────────────────

type TopSort = 'profit' | 'revenue' | 'lowMargin'

const TOP_SORT_TABS: { key: TopSort; label: string }[] = [
  { key: 'profit',    label: 'Profit'   },
  { key: 'revenue',   label: 'Revenue'  },
  { key: 'lowMargin', label: 'Low Margin' },
]

function CategoryTopList({
  label, rows, accent,
}: {
  label: string
  rows: DrinkProfitSummary[]
  accent: 'amber' | 'orange'
}) {
  const [sortKey, setSortKey] = useState<TopSort>('profit')

  const eligibleRows = rows.filter(r => {
    if (sortKey === 'profit')    return r.estimated_profit != null
    if (sortKey === 'lowMargin') return r.has_full_cost && r.profit_margin_pct != null && r.quantity_sold > 0
    return true
  })

  const sorted = [...eligibleRows].sort((a, b) => {
    if (sortKey === 'profit')    return (b.estimated_profit ?? -Infinity) - (a.estimated_profit ?? -Infinity)
    if (sortKey === 'lowMargin') return (a.profit_margin_pct ?? 100) - (b.profit_margin_pct ?? 100)
    return (b.gross_revenue ?? 0) - (a.gross_revenue ?? 0)
  }).slice(0, 5)

  function getVal(r: DrinkProfitSummary): number {
    if (sortKey === 'profit')    return Math.max(0, r.estimated_profit ?? 0)
    if (sortKey === 'lowMargin') return r.profit_margin_pct ?? 0
    return r.gross_revenue ?? 0
  }

  function fmtVal(r: DrinkProfitSummary): string {
    if (sortKey === 'profit')    return r.estimated_profit != null ? fmtDollar(r.estimated_profit) : '—'
    if (sortKey === 'lowMargin') return r.profit_margin_pct != null ? `${r.profit_margin_pct.toFixed(0)}%` : '—'
    return fmtDollar(r.gross_revenue ?? 0)
  }

  const maxVal = Math.max(...sorted.map(getVal), 1)

  const isWarning = sortKey === 'lowMargin'

  const dotCls  = accent === 'amber' ? 'bg-amber-400/70' : 'bg-orange-400/70'
  const barCls  = isWarning
    ? 'bg-red-500/30'
    : accent === 'amber' ? 'bg-amber-400/35' : 'bg-orange-400/35'
  const valCls  = isWarning
    ? 'text-red-400'
    : accent === 'amber' ? 'text-amber-400' : 'text-orange-400'

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center gap-3">
        <span className={`w-2 h-2 rounded-sm ${dotCls} shrink-0`} />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex-1">{label}</p>
        <div className="flex items-center gap-0.5 bg-slate-800 rounded-md p-0.5">
          {TOP_SORT_TABS.map(({ key, label: tabLabel }) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sortKey === key
                  ? isWarning && key === 'lowMargin' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-200'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-slate-700">No data for this view</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3.5">
          {sorted.map((row, i) => {
            const val    = getVal(row)
            const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0

            return (
              <div key={row.id ?? i}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-slate-700 tabular-nums w-3 shrink-0 text-right">{i + 1}</span>
                  <p className="text-xs text-slate-300 truncate flex-1 min-w-0">{row.menu_item?.name ?? '—'}</p>
                  <p className={`text-xs font-semibold tabular-nums shrink-0 ${valCls}`}>{fmtVal(row)}</p>
                </div>
                <div className="ml-5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barCls}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
