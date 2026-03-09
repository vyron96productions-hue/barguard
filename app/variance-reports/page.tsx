'use client'

import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import type { InventoryUsageSummary } from '@/types'

const AVG_COST_PER_OZ = 0.85

export default function VarianceReportsPage() {
  const [summaries, setSummaries] = useState<InventoryUsageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  const filtered = statusFilter === 'all' ? summaries : summaries.filter((s) => s.status === statusFilter)

  const totalVariance = summaries.reduce((acc, s) => acc + s.variance, 0)
  const criticalCount = summaries.filter((s) => s.status === 'critical').length
  const warningCount = summaries.filter((s) => s.status === 'warning').length

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Variance Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">Compare expected vs actual liquor usage by item.</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="col-span-2 sm:col-auto sm:self-end px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 active:bg-amber-300 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">Total Variance</p>
            <p className={`text-xl sm:text-3xl font-bold mt-1 ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">oz</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">Critical</p>
            <p className="text-xl sm:text-3xl font-bold mt-1 text-red-400">{criticalCount}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">items</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-5">
            <p className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">Warning</p>
            <p className="text-xl sm:text-3xl font-bold mt-1 text-yellow-400">{warningCount}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">items</p>
          </div>
        </div>
      )}

      {/* Data */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📉</p>
          <p className="text-sm">No variance data found. Upload CSVs and run calculations from the dashboard.</p>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="lg:hidden space-y-3">
            {filtered.map((s) => {
              const estLoss = Math.max(0, s.variance) * AVG_COST_PER_OZ
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  {/* Item + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-100 text-sm">{s.inventory_item?.name ?? '—'}</p>
                      {s.inventory_item?.category && (
                        <p className="text-xs text-gray-500">{s.inventory_item.category}</p>
                      )}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {/* Period */}
                  <p className="text-[11px] text-gray-600">
                    {s.period_start} – {s.period_end}
                  </p>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Expected</p>
                      <p className="text-gray-300 font-medium">{s.expected_usage.toFixed(1)} oz</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Actual</p>
                      <p className="text-gray-300 font-medium">{s.actual_usage.toFixed(1)} oz</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Variance</p>
                      <p className={`font-semibold ${s.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)} oz
                        {s.variance_percent !== null && (
                          <span className="text-gray-500 font-normal ml-1">({s.variance_percent.toFixed(1)}%)</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Est. Loss</p>
                      <p className={`font-semibold ${estLoss > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {estLoss > 0 ? `~$${estLoss.toFixed(2)}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Secondary metrics */}
                  <div className="flex items-center gap-4 text-[11px] text-gray-600 border-t border-gray-800 pt-2">
                    <span>Beginning: {s.beginning_inventory.toFixed(1)}</span>
                    <span>Purchased: {s.purchased.toFixed(1)}</span>
                    <span>Ending: {s.ending_inventory.toFixed(1)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-left">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Beginning</th>
                    <th className="px-5 py-3">Purchased</th>
                    <th className="px-5 py-3">Ending</th>
                    <th className="px-5 py-3">Actual</th>
                    <th className="px-5 py-3">Expected</th>
                    <th className="px-5 py-3">Variance</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-5 py-3 font-medium">{s.inventory_item?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-400">{s.inventory_item?.category ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{s.period_start} – {s.period_end}</td>
                      <td className="px-5 py-3 text-gray-400">{s.beginning_inventory.toFixed(1)}</td>
                      <td className="px-5 py-3 text-gray-400">{s.purchased.toFixed(1)}</td>
                      <td className="px-5 py-3 text-gray-400">{s.ending_inventory.toFixed(1)}</td>
                      <td className="px-5 py-3 text-gray-300">{s.actual_usage.toFixed(1)}</td>
                      <td className="px-5 py-3 text-gray-300">{s.expected_usage.toFixed(1)}</td>
                      <td className={`px-5 py-3 font-medium ${s.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)}
                        {s.variance_percent !== null && (
                          <span className="text-gray-500 text-xs ml-1">({s.variance_percent.toFixed(1)}%)</span>
                        )}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
