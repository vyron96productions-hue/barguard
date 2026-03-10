'use client'

import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import type { InventoryUsageSummary } from '@/types'

export default function VarianceReportsPage() {
  const [summaries, setSummaries] = useState<InventoryUsageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'beverage' | 'food'>('all')

  useEffect(() => { fetchReports() }, [])

  async function fetchReports() {
    setLoading(true)
    const params = new URLSearchParams()
    if (periodStart) params.set('period_start', periodStart)
    if (periodEnd) params.set('period_end', periodEnd)
    const res = await fetch(`/api/reports/variance?${params}`)
    const data = await res.json()
    setSummaries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filtered = summaries.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (typeFilter !== 'all') {
      const itemType = (s.inventory_item as any)?.item_type ?? 'beverage'
      if (itemType !== typeFilter) return false
    }
    return true
  })

  // KPIs from the filtered set
  const totalEstLoss = filtered.reduce((acc, s) => {
    const cost = (s.inventory_item as any)?.cost_per_unit ?? 0
    return acc + Math.max(0, s.variance) * cost
  }, 0)
  const hasCostData = filtered.some(s => (s.inventory_item as any)?.cost_per_unit != null)
  const criticalCount = filtered.filter((s) => s.status === 'critical').length
  const warningCount = filtered.filter((s) => s.status === 'warning').length

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Loss Reports</h1>
        <p className="text-slate-500 mt-1 text-sm">Compare expected vs actual usage — catch over-pouring, theft, and waste.</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            >
              <option value="all">All statuses</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="col-span-2 sm:col-auto sm:self-end px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 active:bg-amber-300 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 w-fit">
          {([
            { key: 'all',      label: 'All Items' },
            { key: 'beverage', label: 'Beverages' },
            { key: 'food',     label: 'Kitchen / Food' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                typeFilter === key ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider leading-tight">Est. Loss</p>
            <p className={`text-xl sm:text-3xl font-bold mt-1 tabular-nums ${totalEstLoss > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {hasCostData ? `$${totalEstLoss.toFixed(2)}` : '—'}
            </p>
            {!hasCostData && (
              <p className="text-[10px] text-slate-700 mt-0.5">set item costs to track</p>
            )}
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider leading-tight">Critical</p>
            <p className="text-xl sm:text-3xl font-bold mt-1 text-red-400">{criticalCount}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">items</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider leading-tight">Warning</p>
            <p className="text-xl sm:text-3xl font-bold mt-1 text-amber-400">{warningCount}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">items</p>
          </div>
        </div>
      )}

      {/* Data */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-3xl mb-3">◉</p>
          <p className="text-sm">No variance data found. Upload reports and run calculations from the dashboard.</p>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="lg:hidden space-y-3">
            {filtered.map((s) => {
              const unit = s.inventory_item?.unit ?? 'units'
              const costPerUnit = (s.inventory_item as any)?.cost_per_unit ?? 0
              const estLoss = Math.max(0, s.variance) * costPerUnit
              return (
                <div key={s.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{s.inventory_item?.name ?? '—'}</p>
                      {s.inventory_item?.category && (
                        <p className="text-xs text-slate-500 mt-0.5">{s.inventory_item.category}</p>
                      )}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {s.period_start} – {s.period_end}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/50 rounded-xl p-2.5">
                      <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Expected</p>
                      <p className="text-slate-300 font-medium">{s.expected_usage.toFixed(1)} {unit}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2.5">
                      <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Actual</p>
                      <p className="text-slate-300 font-medium">{s.actual_usage.toFixed(1)} {unit}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2.5">
                      <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Variance</p>
                      <p className={`font-semibold ${s.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)} {unit}
                        {s.variance_percent !== null && (
                          <span className="text-slate-500 font-normal ml-1">({s.variance_percent.toFixed(1)}%)</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2.5">
                      <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Est. Loss</p>
                      <p className={`font-semibold ${costPerUnit > 0 && estLoss > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                        {costPerUnit > 0 && estLoss > 0 ? `~$${estLoss.toFixed(2)}` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-600 border-t border-slate-800 pt-2 flex-wrap">
                    <span>Beginning: {s.beginning_inventory.toFixed(1)} {unit}</span>
                    <span>Purchased: {s.purchased.toFixed(1)} {unit}</span>
                    <span>Ending: {s.ending_inventory.toFixed(1)} {unit}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30 text-left">
                    {['Item', 'Category', 'Period', 'Beginning', 'Purchased', 'Ending', 'Actual', 'Expected', 'Variance', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const unit = s.inventory_item?.unit ?? ''
                    return (
                      <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-200">{s.inventory_item?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{s.inventory_item?.category ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{s.period_start} – {s.period_end}</td>
                        <td className="px-5 py-3 text-slate-400 tabular-nums">{s.beginning_inventory.toFixed(1)} <span className="text-slate-700">{unit}</span></td>
                        <td className="px-5 py-3 text-slate-400 tabular-nums">{s.purchased.toFixed(1)} <span className="text-slate-700">{unit}</span></td>
                        <td className="px-5 py-3 text-slate-400 tabular-nums">{s.ending_inventory.toFixed(1)} <span className="text-slate-700">{unit}</span></td>
                        <td className="px-5 py-3 text-slate-300 tabular-nums">{s.actual_usage.toFixed(1)} <span className="text-slate-700">{unit}</span></td>
                        <td className="px-5 py-3 text-slate-300 tabular-nums">{s.expected_usage.toFixed(1)} <span className="text-slate-700">{unit}</span></td>
                        <td className={`px-5 py-3 font-semibold tabular-nums ${s.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)} <span className="font-normal text-xs text-slate-600">{unit}</span>
                          {s.variance_percent !== null && (
                            <span className="text-slate-600 text-xs font-normal ml-1">({s.variance_percent.toFixed(1)}%)</span>
                          )}
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
