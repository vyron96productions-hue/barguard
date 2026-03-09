'use client'

import { useEffect, useState } from 'react'
import type { DrinkProfitSummary } from '@/types'

interface Props {
  periodStart: string
  periodEnd: string
  shiftLabel?: string | null
}

export default function DrinkProfitPreview({ periodStart, periodEnd, shiftLabel }: Props) {
  const [summaries, setSummaries] = useState<DrinkProfitSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({
      period_start: periodStart,
      period_end: periodEnd,
    })
    if (shiftLabel != null) params.set('shift_label', shiftLabel)

    fetch(`/api/reports/profit?${params}`)
      .then((r) => r.json())
      .then((data) => { setSummaries(Array.isArray(data) ? data.slice(0, 5) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [periodStart, periodEnd, shiftLabel])

  if (loading) return null
  if (summaries.length === 0) return null

  const totalProfit = summaries.reduce((s, r) => s + (r.estimated_profit ?? 0), 0)

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" d="M8 2v12M5 4h4.5a2.5 2.5 0 010 5H5m0-5v5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Drink Profit</p>
        </div>
        <a href="/profit-intelligence" className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
          View all →
        </a>
      </div>

      {/* Top drinks */}
      <div className="px-4 sm:px-5 py-3 space-y-2">
        {summaries.map((row, i) => {
          const name = row.menu_item?.name ?? 'Unknown'
          const profit = row.estimated_profit
          const margin = row.profit_margin_pct
          const maxProfit = summaries[0]?.estimated_profit ?? 1

          return (
            <div key={row.id ?? i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-slate-300 truncate">{name}</p>
                  <p className="text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                    {profit != null ? `$${profit.toFixed(0)}` : '—'}
                  </p>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/50"
                    style={{ width: `${profit != null && maxProfit > 0 ? (profit / maxProfit) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {margin != null && (
                <p className="text-[10px] text-slate-600 tabular-nums w-10 text-right shrink-0">
                  {margin.toFixed(0)}%
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer total */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-slate-800/60 flex items-center justify-between">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Top {summaries.length} drinks</p>
        <p className="text-xs font-semibold text-slate-400">
          ${totalProfit.toFixed(0)} total profit
        </p>
      </div>
    </div>
  )
}
