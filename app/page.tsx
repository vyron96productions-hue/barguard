'use client'

import { useState, useMemo } from 'react'
import KpiCard from '@/components/dashboard/KpiCard'
import RiskTable from '@/components/dashboard/RiskTable'
import AiSummaryCard from '@/components/dashboard/AiSummaryCard'
import NextActionsPanel from '@/components/dashboard/NextActionsPanel'
import UsageChart from '@/components/dashboard/UsageChart'
import ShiftSelector from '@/components/dashboard/ShiftSelector'
import PerformanceSummaryCard from '@/components/dashboard/PerformanceSummaryCard'
import DrinkProfitPreview from '@/components/dashboard/DrinkProfitPreview'
import { SHIFT_PRESETS, resolveShiftWindow, type ResolvedShiftWindow } from '@/lib/shifts'
import type { PerformanceData } from '@/app/api/reports/performance/route'
import type { InventoryUsageSummary, AiSummary } from '@/types'

const AVG_COST_PER_OZ = 0.85

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDateRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

/** 'HH:MM' → '6:00 PM' */
function fmt12hFromHHMM(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function computeMetrics(summaries: InventoryUsageSummary[]) {
  const critical = summaries.filter((s) => s.status === 'critical')
  const warning  = summaries.filter((s) => s.status === 'warning')
  const normal   = summaries.filter((s) => s.status === 'normal')
  const total    = summaries.length

  const totalVarianceOz = summaries.reduce((acc, s) => acc + Math.max(0, s.variance), 0)
  const estimatedLoss   = totalVarianceOz * AVG_COST_PER_OZ

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

// ── Viewing context ribbon ────────────────────────────────────────────────────
function ViewingBanner({
  window: w,
  customLabel,
  periodStart,
  periodEnd,
  isShift,
}: {
  window: ResolvedShiftWindow | null
  customLabel: string | null
  periodStart: string
  periodEnd: string
  isShift: boolean
}) {
  const label = w?.displayLabel
    ?? customLabel
    ?? (periodStart && periodEnd ? fmtDateRange(periodStart, periodEnd) : null)

  if (!label) return null

  const isLive = w?.isLiveEnd ?? false
  const type   = w
    ? (isLive ? 'live shift' : 'shift')
    : customLabel
    ? 'custom range'
    : 'date range'

  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15">
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-amber-400/70" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
          <circle cx="8" cy="8" r="6" />
          <path strokeLinecap="round" d="M8 5v3l2 2" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-amber-500/50 uppercase tracking-widest font-medium mb-0.5">Viewing · {type}</p>
        <p className="text-sm font-semibold text-amber-200/80 leading-snug truncate">{label}</p>
      </div>

      {isLive && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] text-amber-400 font-medium">Live</span>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [summaries,    setSummaries]    = useState<InventoryUsageSummary[]>([])
  const [aiSummary,    setAiSummary]    = useState<AiSummary | null>(null)
  const [perfData,     setPerfData]     = useState<PerformanceData | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [generating,   setGenerating]   = useState(false)
  const [clearing,     setClearing]     = useState(false)
  const [calcMsg,      setCalcMsg]      = useState('')
  const [cmdError,     setCmdError]     = useState('')

  // ── Date-range state ───────────────────────────────────────────────────────
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd,   setPeriodEnd]   = useState('')
  const [startTime,   setStartTime]   = useState('')   // HH:MM, optional
  const [endTime,     setEndTime]     = useState('')   // HH:MM, optional

  // ── Shift state ────────────────────────────────────────────────────────────
  const [calcMode,       setCalcMode]       = useState<string>('daterange')
  const [serviceDate,    setServiceDate]    = useState<string>(todayIso())
  const [useCurrentTime, setUseCurrentTime] = useState(false)

  // ── Operational metrics — kept for AI summary context ─────────────────────
  const [lastTotalRevenue, setLastTotalRevenue] = useState<number | null>(null)
  const [lastTotalCovers,  setLastTotalCovers]  = useState<number | null>(null)

  // ── Derived shift window from preset (browser timezone) ──────────────────
  const resolvedWindow = useMemo<ResolvedShiftWindow | null>(() => {
    if (calcMode === 'daterange') return null
    const preset = SHIFT_PRESETS.find((p) => p.id === calcMode)
    if (!preset || !serviceDate) return null
    return resolveShiftWindow(preset, serviceDate, useCurrentTime)
  }, [calcMode, serviceDate, useCurrentTime])

  // ── Custom time window from free-form date + time inputs ──────────────────
  // Only active in date-range mode when both dates AND both times are set.
  const customShiftWindow = useMemo(() => {
    if (calcMode !== 'daterange') return null
    if (!periodStart || !startTime || !endTime) return null
    const endDate = periodEnd || periodStart
    // Construct local-time ISO strings — Date constructor uses browser timezone
    const shiftStart = new Date(`${periodStart}T${startTime}`).toISOString()
    const shiftEnd   = new Date(`${endDate}T${endTime}`).toISOString()
    const label = `Custom · ${fmtDateRange(periodStart, endDate)} · ${fmt12hFromHHMM(startTime)} – ${fmt12hFromHHMM(endTime)}`
    return { shiftStart, shiftEnd, label, periodStart, periodEnd: endDate }
  }, [calcMode, periodStart, periodEnd, startTime, endTime])

  const isShift = calcMode !== 'daterange'

  // ── Helpers ────────────────────────────────────────────────────────────────
  function effectivePeriod() {
    if (resolvedWindow)   return { start: resolvedWindow.periodStart,   end: resolvedWindow.periodEnd }
    if (customShiftWindow) return { start: customShiftWindow.periodStart, end: customShiftWindow.periodEnd }
    return { start: periodStart, end: periodEnd }
  }

  function buildCalcPayload() {
    if (resolvedWindow) return {
      period_start: resolvedWindow.periodStart,
      period_end:   resolvedWindow.periodEnd,
      shift_start:  resolvedWindow.shiftStart,
      shift_end:    resolvedWindow.shiftEnd,
      shift_label:  resolvedWindow.displayLabel,
    }
    if (customShiftWindow) return {
      period_start: customShiftWindow.periodStart,
      period_end:   customShiftWindow.periodEnd,
      shift_start:  customShiftWindow.shiftStart,
      shift_end:    customShiftWindow.shiftEnd,
      shift_label:  customShiftWindow.label,
    }
    return { period_start: periodStart, period_end: periodEnd }
  }

  async function fetchData(
    start: string,
    end: string,
    shiftLabel?: string | null,
    shiftStart?: string | null,
    shiftEnd?: string | null,
  ) {
    setLoading(true)

    const rptParams  = new URLSearchParams({ period_start: start, period_end: end })
    if (shiftLabel) rptParams.set('shift_label', shiftLabel)

    const perfParams = new URLSearchParams({ period_start: start, period_end: end })
    if (shiftStart) perfParams.set('shift_start', shiftStart)
    if (shiftEnd)   perfParams.set('shift_end',   shiftEnd)

    const [rpt, ai, perf] = await Promise.all([
      fetch(`/api/reports/variance?${rptParams}`).then((r) => r.json()),
      fetch(`/api/ai/summary?${rptParams}`).then((r) => r.json()),
      fetch(`/api/reports/performance?${perfParams}`).then((r) => r.json()),
    ])
    setSummaries(Array.isArray(rpt) ? rpt : [])
    setAiSummary(ai ?? null)
    setPerfData(perf && !perf.error ? perf : null)
    setLoading(false)
  }

  async function runCalculation() {
    const { start, end } = effectivePeriod()
    if (!start || !end) { setCmdError('Select a period first'); return }
    setCmdError('')
    setCalcMsg('Calculating…')
    setSummaries([])
    setAiSummary(null)
    setLastTotalRevenue(null)
    setLastTotalCovers(null)

    const res  = await fetch('/api/calculations/variance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCalcPayload()),
    })
    const data = await res.json()

    if (res.ok) {
      setCalcMsg(`${data.calculated} items calculated`)
      setLastTotalRevenue(data.total_revenue ?? null)
      setLastTotalCovers(data.total_covers  ?? null)
      const sl  = resolvedWindow?.displayLabel    ?? customShiftWindow?.label      ?? null
      const ss  = resolvedWindow?.shiftStart      ?? customShiftWindow?.shiftStart ?? null
      const se  = resolvedWindow?.shiftEnd        ?? customShiftWindow?.shiftEnd   ?? null
      fetchData(start, end, sl, ss, se)
    } else {
      setCalcMsg(data.error)
    }
  }

  async function clearResults() {
    if (!confirm('Clear all calculation results?')) return
    setClearing(true)
    await fetch('/api/calculations/clear', { method: 'POST' })
    setSummaries([])
    setAiSummary(null)
    setCalcMsg('')
    setLastTotalRevenue(null)
    setLastTotalCovers(null)
    setPerfData(null)
    setClearing(false)
  }

  async function generateSummary() {
    const { start, end } = effectivePeriod()
    if (!start || !end) { setCmdError('Select a period first'); return }
    setCmdError('')
    setGenerating(true)
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period_start:  start,
        period_end:    end,
        shift_label:   resolvedWindow?.displayLabel ?? null,
        total_revenue: lastTotalRevenue,
        total_covers:  lastTotalCovers,
      }),
    })
    const data = await res.json()
    if (res.ok) setAiSummary(data)
    else alert(data.error)
    setGenerating(false)
  }

  const { critical, warning, normal, totalVarianceOz, estimatedLoss, healthScore, highestRisk } = computeMetrics(summaries)
  const hasData = summaries.length > 0
  const hc      = healthColor(healthScore)
  const hasPerfData = perfData != null && (perfData.total_items_sold > 0 || perfData.transaction_count > 0)

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Inventory risk · The Rusty Tap</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Monitoring</span>
        </div>
      </div>

      {/* ── Command Bar ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">

        {/* Section 1 — Time window selector */}
        <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col gap-3">

          <ShiftSelector
            mode={calcMode}
            serviceDate={serviceDate}
            useCurrentTime={useCurrentTime}
            onModeChange={(m) => { setCalcMode(m); setCmdError(''); setCalcMsg(''); setStartTime(''); setEndTime('') }}
            onServiceDateChange={(d) => { setServiceDate(d); setCmdError('') }}
            onUseCurrentTimeChange={setUseCurrentTime}
          />

          {/* Date-range inputs */}
          {!isShift && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* From */}
                <div className="flex items-center gap-0 bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden hover:border-slate-700/70 transition-colors">
                  <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-700/40">
                    <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <rect x="2" y="3" width="12" height="10" rx="2" /><path strokeLinecap="round" d="M5 1v2M11 1v2M2 7h12" />
                    </svg>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium shrink-0">From</span>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => { setPeriodStart(e.target.value); setCmdError('') }}
                      className="bg-transparent text-sm text-slate-200 focus:outline-none w-[7.5rem] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="8" cy="8" r="6" /><path strokeLinecap="round" d="M8 5v3l2 2" />
                    </svg>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => { setStartTime(e.target.value); setCmdError('') }}
                      className="bg-transparent text-sm focus:outline-none w-[5.5rem] cursor-pointer tabular-nums text-slate-400 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <svg className="w-4 h-4 text-slate-700 shrink-0 hidden sm:block" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>

                {/* To */}
                <div className="flex items-center gap-0 bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden hover:border-slate-700/70 transition-colors">
                  <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-700/40">
                    <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <rect x="2" y="3" width="12" height="10" rx="2" /><path strokeLinecap="round" d="M5 1v2M11 1v2M2 7h12" />
                    </svg>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium shrink-0">To</span>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => { setPeriodEnd(e.target.value); setCmdError('') }}
                      className="bg-transparent text-sm text-slate-200 focus:outline-none w-[7.5rem] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="8" cy="8" r="6" /><path strokeLinecap="round" d="M8 5v3l2 2" />
                    </svg>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => { setEndTime(e.target.value); setCmdError('') }}
                      className="bg-transparent text-sm focus:outline-none w-[5.5rem] cursor-pointer tabular-nums text-slate-400 placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Hint when only times are partially filled */}
              {(startTime || endTime) && !(startTime && endTime) && (
                <p className="text-[10px] text-slate-600">Set both times to filter by time window, or leave both empty for full-day range.</p>
              )}

              {/* Custom window preview */}
              {customShiftWindow && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-amber-500/40 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="6" /><path strokeLinecap="round" d="M8 5v3l2 2" />
                  </svg>
                  <span className="text-xs text-slate-500">{customShiftWindow.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Resolved shift window preview */}
          {isShift && resolvedWindow && (
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-amber-500/40 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="6" /><path strokeLinecap="round" d="M8 5v3l2 2" />
              </svg>
              <span className="text-xs text-slate-500">{resolvedWindow.displayLabel}</span>
              {resolvedWindow.isLiveEnd && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400/70 font-medium">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />live
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800/60" />

        {/* Section 2 — Actions */}
        <div className="px-4 sm:px-5 py-3 flex items-center gap-2">
          <button
            onClick={runCalculation}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-900 font-semibold rounded-xl text-sm transition-all duration-150 shadow-[0_0_18px_rgba(245,158,11,0.20)] shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l6 5-6 5V3z" />
            </svg>
            Run Calculations
          </button>

          <button
            onClick={generateSummary}
            disabled={generating || !hasData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 font-medium rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8c0-1 .5-2 1.5-2.5M8 2a6 6 0 014.5 10M8 5v3l2 2" />
            </svg>
            {generating ? 'Generating…' : 'AI Summary'}
          </button>

          {/* Status feedback */}
          <div className="flex-1 min-w-0">
            {cmdError && <span className="text-xs text-red-400 font-medium">{cmdError}</span>}
            {calcMsg && !cmdError && <span className="text-xs text-amber-400/80 font-medium">{calcMsg}</span>}
          </div>

          {/* Clear */}
          <button
            onClick={clearResults}
            disabled={clearing}
            title="Clear results"
            className="p-2 text-slate-700 hover:text-red-400 rounded-xl transition-colors disabled:opacity-40 hover:bg-red-500/5 border border-transparent hover:border-red-500/15 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M3 4h10M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Viewing context ribbon ─────────────────────────────────────────── */}
      {hasData && (
        <ViewingBanner
          window={resolvedWindow}
          customLabel={customShiftWindow?.label ?? null}
          periodStart={periodStart}
          periodEnd={periodEnd}
          isShift={isShift}
        />
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {hasData ? (
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Business performance — shown whenever we have sales data */}
          {hasPerfData && <PerformanceSummaryCard data={perfData!} />}

          {/* Drink profit preview — shown when profit data has been calculated */}
          {hasPerfData && (() => {
            const ep = effectivePeriod()
            const shiftLabel = resolvedWindow?.displayLabel ?? customShiftWindow?.label ?? null
            if (!ep.start || !ep.end) return null
            return (
              <DrinkProfitPreview
                periodStart={ep.start}
                periodEnd={ep.end}
                shiftLabel={shiftLabel}
              />
            )
          })()}

          {/* Inventory health KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <KpiCard
              label="Critical Items"
              value={critical.length}
              sub={critical.length > 0 ? 'Immediate attention' : 'No critical issues'}
              accent="red" icon="⚠"
            />
            <KpiCard
              label="Warning Items"
              value={warning.length}
              sub={warning.length > 0 ? 'Monitor closely' : 'No warnings'}
              accent="amber" icon="◐"
            />
            <KpiCard
              label="Healthy Items"
              value={normal.length}
              sub="Within range"
              accent="green" icon="✓"
            />
            <KpiCard
              label="Est. Loss"
              value={`$${estimatedLoss.toFixed(0)}`}
              sub={`${totalVarianceOz.toFixed(1)} oz over`}
              accent="red" icon="$"
              note={`~$${AVG_COST_PER_OZ}/oz avg cost`}
            />
            <KpiCard
              label="Health Score"
              value={`${healthScore}`}
              sub="out of 100"
              accent={hc} icon="◈"
              gaugeValue={healthScore}
              note={highestRisk ? `Risk: ${highestRisk.inventory_item?.name ?? '—'}` : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 rounded-2xl bg-slate-900/40 border border-slate-800/40 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4">
            <span className="text-slate-500 text-xl">◈</span>
          </div>
          <p className="text-slate-400 font-medium text-sm">
            {loading ? 'Loading…' : 'No data for this period'}
          </p>
          <p className="text-slate-600 text-xs mt-1 text-center px-4">
            {!loading && (isShift ? 'Pick a shift and service date, then run calculations' : 'Set a date range and run calculations')}
          </p>
        </div>
      )}

      {/* ── Highest Risk Banner ────────────────────────────────────────────── */}
      {hasData && highestRisk && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl bg-red-500/[0.04] border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2L2 13h12L8 2zm0 4v3m0 2.5h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Highest Risk Item</p>
              <p className="text-sm font-bold text-slate-100 mt-0.5">
                {highestRisk.inventory_item?.name ?? '—'}
                <span className="ml-2 text-red-400 font-semibold">
                  {highestRisk.variance > 0 ? '+' : ''}{highestRisk.variance.toFixed(1)} oz
                  {highestRisk.variance_percent !== null && ` (${highestRisk.variance_percent.toFixed(1)}%)`}
                </span>
              </p>
            </div>
          </div>
          <div className="sm:ml-auto sm:text-right pl-12 sm:pl-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Est. Loss</p>
            <p className="text-xl font-bold text-red-400">
              ~${(Math.max(0, highestRisk.variance) * 0.85).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* ── Risk Table + Next Actions ───────────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><RiskTable summaries={summaries} /></div>
          <div><NextActionsPanel summaries={summaries} /></div>
        </div>
      )}

      {hasData && <UsageChart summaries={summaries} />}
      {aiSummary && <AiSummaryCard summary={aiSummary} />}
    </div>
  )
}
