'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ExpenseAnalytics } from '@/types'

export default function ExpenseSummaryCard() {
  const [data, setData]       = useState<ExpenseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/expenses')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/60 border-l-2 border-l-blue-500 p-4 sm:p-5 animate-pulse">
        <div className="h-3 w-32 bg-slate-800 rounded mb-3" />
        <div className="h-6 w-24 bg-slate-800 rounded" />
      </div>
    )
  }

  if (!data) return null

  const hasData = data.total_this_month > 0 || data.receipt_count_this_month > 0

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/60 border-l-2 border-l-blue-500 p-4 sm:p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-md border bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px] font-bold">
            🧾
          </span>
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Operating Expenses
          </p>
        </div>
        <Link href="/expenses/analytics" className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
          Details →
        </Link>
      </div>

      {!hasData ? (
        <div className="relative">
          <p className="text-sm text-slate-500">No expenses recorded this month.</p>
          <Link href="/expenses" className="text-xs text-blue-400 hover:underline mt-1 block">
            + Scan a receipt
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">This Week</p>
              <p className="text-lg sm:text-xl font-bold text-blue-400">${data.total_this_week.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">This Month</p>
              <p className="text-lg sm:text-xl font-bold text-blue-400">${data.total_this_month.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Receipts</p>
              <p className="text-lg sm:text-xl font-bold text-slate-200">{data.receipt_count_this_month}</p>
            </div>
          </div>

          {/* Top category */}
          {data.top_category && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>Top category:</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                {data.top_category}
              </span>
            </div>
          )}

          {/* Recent spend bar chart */}
          {data.by_category.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">By Category (90 days)</p>
              {data.by_category.slice(0, 4).map((c) => {
                const maxVal = data.by_category[0]?.total ?? 1
                const pct = Math.round((c.total / maxVal) * 100)
                return (
                  <div key={c.category_name} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{c.category_name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500/60 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-400 font-medium w-14 text-right shrink-0">
                      ${c.total.toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Note: separate from inventory */}
          <p className="text-[9px] text-slate-600 leading-relaxed border-t border-slate-800/60 pt-2 mt-3">
            Non-inventory expenses — separate from inventory loss calculations
          </p>
        </div>
      )}
    </div>
  )
}
