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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Variance Reports</h1>
        <p className="text-gray-500 mt-1">Compare expected vs actual liquor usage by item.</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Period Start</label>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Period End</label>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200">
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <button onClick={fetchReports}
          className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400">
          Apply Filters
        </button>
      </div>

      {/* Summary KPIs */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Variance (oz)</p>
            <p className={`text-3xl font-bold mt-1 ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Critical Items</p>
            <p className="text-3xl font-bold mt-1 text-red-400">{criticalCount}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Warning Items</p>
            <p className="text-3xl font-bold mt-1 text-yellow-400">{warningCount}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📉</p>
          <p>No variance data found. Upload CSVs and run calculations from the dashboard.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-left">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Beginning (oz)</th>
                <th className="px-5 py-3">Purchased (oz)</th>
                <th className="px-5 py-3">Ending (oz)</th>
                <th className="px-5 py-3">Actual (oz)</th>
                <th className="px-5 py-3">Expected (oz)</th>
                <th className="px-5 py-3">Variance</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium">{s.inventory_item?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{s.inventory_item?.category ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{s.period_start} – {s.period_end}</td>
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
      )}
    </div>
  )
}
