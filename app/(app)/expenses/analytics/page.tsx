'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ExpenseAnalytics } from '@/types'

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ExpenseAnalyticsPage() {
  const [data, setData]       = useState<ExpenseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/reports/expenses')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Expense Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Non-inventory operating expense summary</p>
        </div>
        <Link
          href="/expenses"
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-colors"
        >
          + Scan Receipt
        </Link>
      </div>

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="This Week" value={`$${data.total_this_week.toFixed(2)}`} accent="blue" />
            <StatCard label="This Month" value={`$${data.total_this_month.toFixed(2)}`} accent="blue" />
            <StatCard label="Receipts (Month)" value={String(data.receipt_count_this_month)} accent="slate" />
            <StatCard label="Top Category" value={data.top_category ?? '—'} accent="slate" small />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* By category */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Spend by Category (90 days)</p>
              </div>
              {data.by_category.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">No data yet.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {data.by_category.map((c) => {
                    const maxVal = data.by_category[0]?.total ?? 1
                    const pct = Math.round((c.total / maxVal) * 100)
                    return (
                      <div key={c.category_name} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-300 font-medium">{c.category_name}</span>
                            <span className="text-sm font-semibold text-blue-400">${c.total.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500/70 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-600 shrink-0">{c.count}×</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* By vendor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Top Vendors (this month)</p>
              </div>
              {data.by_vendor.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">No data yet.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {data.by_vendor.map((v) => (
                    <div key={v.vendor_name} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-slate-300 truncate flex-1">{v.vendor_name}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs text-slate-500">{v.count} receipt{v.count !== 1 ? 's' : ''}</span>
                        <span className="text-sm font-semibold text-blue-400">${v.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent receipts */}
          {data.recent.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Recent Expenses</p>
                <Link href="/expenses/history" className="text-xs text-blue-400 hover:underline">View all →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {data.recent.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300 font-medium">{r.vendor_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{fmt(r.receipt_date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">${Number(r.total_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* P&L note */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-2">Combined Margin Impact</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Misc operating expenses reduce net profitability independently of inventory loss.
              This month&apos;s operating expense spend of{' '}
              <span className="text-blue-300 font-semibold">${data.total_this_month.toFixed(2)}</span>{' '}
              should be viewed alongside your inventory loss figures in Loss Reports for a complete picture of margin impact.
            </p>
            <div className="flex gap-3 mt-3">
              <Link href="/variance-reports" className="text-xs text-blue-400 hover:underline">→ View Loss Reports</Link>
              <Link href="/profit-intelligence" className="text-xs text-blue-400 hover:underline">→ Profit Intelligence</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  small = false,
}: {
  label: string
  value: string
  accent: 'blue' | 'slate'
  small?: boolean
}) {
  const border = accent === 'blue' ? 'border-l-blue-500' : 'border-l-slate-500'
  const val    = accent === 'blue' ? 'text-blue-400' : 'text-slate-200'
  const bg     = accent === 'blue' ? 'from-blue-500/[0.07]' : 'from-slate-500/[0.07]'

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/60 border-l-2 ${border} p-4 sm:p-5`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} to-transparent pointer-events-none`} />
      <p className="relative text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-tight mb-2">{label}</p>
      <p className={`relative font-bold tracking-tight leading-none ${val} ${small ? 'text-base sm:text-lg truncate' : 'text-2xl sm:text-3xl'}`}>{value}</p>
    </div>
  )
}
