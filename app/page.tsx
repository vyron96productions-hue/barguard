'use client'

import { useState } from 'react'
import KpiCard from '@/components/dashboard/KpiCard'
import RiskTable from '@/components/dashboard/RiskTable'
import AiSummaryCard from '@/components/dashboard/AiSummaryCard'
import NextActionsPanel from '@/components/dashboard/NextActionsPanel'
import UsageChart from '@/components/dashboard/UsageChart'
import type { InventoryUsageSummary, AiSummary } from '@/types'

const AVG_COST_PER_OZ = 0.85

function computeMetrics(summaries: InventoryUsageSummary[]) {
  const critical = summaries.filter((s) => s.status === 'critical')
  const warning = summaries.filter((s) => s.status === 'warning')
  const normal = summaries.filter((s) => s.status === 'normal')
  const total = summaries.length

  const totalVarianceOz = summaries.reduce((acc, s) => acc + Math.max(0, s.variance), 0)
  const estimatedLoss = totalVarianceOz * AVG_COST_PER_OZ

  const healthScore = total === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - (critical.length * 3 + warning.length * 1) / (total * 3))))

  const highestRisk = [...summaries]
    .filter((s) => s.variance_percent !== null)
    .sort((a, b) => Math.abs(b.variance_percent!) - Math.abs(a.variance_percent!))[0] ?? null

  return { critical, warning, normal, totalVarianceOz, estimatedLoss, healthScore, highestRisk }
}

function healthColor(score: number): 'red' | 'amber' | 'green' {
  if (score < 40) return 'red'
  if (score < 70) return 'amber'
  return 'green'
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<InventoryUsageSummary[]>([])
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [calcMsg, setCalcMsg] = useState('')

  async function fetchData(start: string, end: string) {
    setLoading(true)
    const params = new URLSearchParams({ period_start: start, period_end: end })
    const [rpt, ai] = await Promise.all([
      fetch(`/api/reports/variance?${params}`).then((r) => r.json()),
      fetch(`/api/ai/summary?${params}`).then((r) => r.json()),
    ])
    setSummaries(Array.isArray(rpt) ? rpt : [])
    setAiSummary(ai ?? null)
    setLoading(false)
  }

  async function runCalculation() {
    if (!periodStart || !periodEnd) { alert('Set period start and end first'); return }
    setCalcMsg('Calculating…')
    setSummaries([])
    setAiSummary(null)
    const res = await fetch('/api/calculations/variance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
    })
    const data = await res.json()
    setCalcMsg(res.ok ? `${data.calculated} items calculated` : data.error)
    if (res.ok) fetchData(periodStart, periodEnd)
  }

  async function clearResults() {
    if (!confirm('Clear all calculation results?')) return
    setClearing(true)
    await fetch('/api/calculations/clear', { method: 'POST' })
    setSummaries([])
    setAiSummary(null)
    setCalcMsg('')
    setClearing(false)
  }

  async function generateSummary() {
    if (!periodStart || !periodEnd) { alert('Set period start and end first'); return }
    setGenerating(true)
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
    })
    const data = await res.json()
    if (res.ok) setAiSummary(data)
    else alert(data.error)
    setGenerating(false)
  }

  const { critical, warning, normal, totalVarianceOz, estimatedLoss, healthScore, highestRisk } = computeMetrics(summaries)
  const hasData = summaries.length > 0
  const hc = healthColor(healthScore)

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Inventory risk monitoring · The Rusty Tap</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Monitoring Inventory Risk</span>
        </div>
      </div>

      {/* Command Bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">From</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">To</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={runCalculation}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-all duration-150 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.35)]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l6 5-6 5V3z" />
          </svg>
          Run Calculations
        </button>

        <button
          onClick={generateSummary}
          disabled={generating || !hasData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-medium rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v3l2 2" />
          </svg>
          {generating ? 'Generating…' : 'AI Summary'}
        </button>

        <button
          onClick={clearResults}
          disabled={clearing}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-400 font-medium rounded-lg text-sm transition-colors disabled:opacity-40 border border-transparent hover:border-red-500/20 hover:bg-red-500/5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h10M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
          </svg>
          {clearing ? 'Clearing…' : 'Clear'}
        </button>

        {calcMsg && (
          <span className="ml-auto text-xs text-amber-400 font-medium">{calcMsg}</span>
        )}
      </div>

      {/* KPI Cards */}
      {hasData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Critical Items"
            value={critical.length}
            sub={critical.length > 0 ? 'Immediate attention required' : 'No critical issues'}
            accent="red"
            icon="⚠"
          />
          <KpiCard
            label="Warning Items"
            value={warning.length}
            sub={warning.length > 0 ? 'Monitor closely' : 'No warnings'}
            accent="amber"
            icon="◐"
          />
          <KpiCard
            label="Healthy Items"
            value={normal.length}
            sub="Within acceptable range"
            accent="green"
            icon="✓"
          />
          <KpiCard
            label="Est. Inventory Loss"
            value={`$${estimatedLoss.toFixed(0)}`}
            sub={`${totalVarianceOz.toFixed(1)} oz over-variance`}
            accent="red"
            icon="$"
            note={`Based on ~$${AVG_COST_PER_OZ}/oz avg cost`}
          />
          <KpiCard
            label="Health Score"
            value={`${healthScore}`}
            sub={`out of 100`}
            accent={hc}
            icon="◈"
            gaugeValue={healthScore}
            note={
              highestRisk
                ? `Highest risk: ${highestRisk.inventory_item?.name ?? '—'}`
                : undefined
            }
          />
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-slate-900/40 border border-slate-800/40 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4">
            <span className="text-slate-500 text-xl">◈</span>
          </div>
          <p className="text-slate-400 font-medium text-sm">No data for this period</p>
          <p className="text-slate-600 text-xs mt-1">
            {loading ? 'Loading…' : 'Set a date range and click Run Calculations'}
          </p>
        </div>
      )}

      {/* Highest Risk Item Banner */}
      {hasData && highestRisk && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/[0.04] border border-red-500/20 glow-red">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2L2 13h12L8 2zm0 4v3m0 2.5h.01" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Highest Risk Item</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              {highestRisk.inventory_item?.name ?? '—'}
              <span className="ml-2 text-red-400 font-semibold">
                {highestRisk.variance > 0 ? '+' : ''}{highestRisk.variance.toFixed(1)} oz
                {highestRisk.variance_percent !== null && ` (${highestRisk.variance_percent.toFixed(1)}%)`}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Est. Loss</p>
            <p className="text-lg font-bold text-red-400">
              ~${(Math.max(0, highestRisk.variance) * 0.85).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Risk Table + Next Actions */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RiskTable summaries={summaries} />
          </div>
          <div>
            <NextActionsPanel summaries={summaries} />
          </div>
        </div>
      )}

      {/* Chart */}
      {hasData && <UsageChart summaries={summaries} />}

      {/* AI Summary */}
      {aiSummary && <AiSummaryCard summary={aiSummary} />}
    </div>
  )
}
