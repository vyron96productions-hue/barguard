'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SalesLogDay, SalesLogItem } from '@/app/api/reports/sales-log/route'

function fmt(n: number | null, prefix = '$') {
  if (n == null) return '—'
  return `${prefix}${n.toFixed(2)}`
}

function dateLabel(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

type TypeFilter = 'all' | 'drink' | 'food'
type Mode = 'day' | 'range'

export default function SalesLogPage() {
  const [mode, setMode] = useState<Mode>('day')
  const [date, setDate] = useState(today())
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [days, setDays] = useState<SalesLogDay[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [stationFilter, setStationFilter] = useState<string>('all') // 'all' | 'none' | station name

  const fetchData = useCallback(async (start: string, end: string, station: string) => {
    if (!start || !end) return
    setLoading(true)
    const params = new URLSearchParams({ date_start: start, date_end: end })
    if (station !== 'all') params.set('station', station)
    const res = await fetch(`/api/reports/sales-log?${params}`)
    const data = await res.json()
    if (data && Array.isArray(data.days)) {
      setDays(data.days)
      // Only update stations list when not filtering (so we can always show all options)
      if (station === 'all') setStations(data.stations ?? [])
    } else {
      setDays([])
    }
    setLoading(false)
  }, [])

  // Single-day mode: fetch on date or station change
  useEffect(() => {
    if (mode === 'day') fetchData(date, date, stationFilter)
  }, [date, mode, stationFilter, fetchData])

  function handleRangeFetch() {
    if (rangeStart && rangeEnd) fetchData(rangeStart, rangeEnd, stationFilter)
  }

  function filterItems(items: SalesLogItem[]): SalesLogItem[] {
    if (typeFilter === 'all') return items
    if (typeFilter === 'drink') return items.filter((i) => i.item_type !== 'food')
    return items.filter((i) => i.item_type === 'food')
  }

  const hasRevenue = days.some((d) => d.total_revenue != null)
  const totalRevenue = days.reduce((s, d) => s + (d.total_revenue ?? 0), 0)
  const totalQty = days.reduce((s, d) => s + d.total_qty, 0)
  const allItems = days.flatMap((d) => filterItems(d.items))
  const hasMultipleDays = days.length > 1

  const stationOptions = [
    { key: 'all', label: 'All Stations' },
    ...stations.map((s) => ({ key: s, label: s })),
    ...(stations.length > 0 ? [{ key: 'none', label: 'Unassigned' }] : []),
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Sales Log</h1>
        <p className="text-slate-500 mt-1 text-sm">Itemized breakdown of what was sold — quantities, prices, and totals.</p>
      </div>

      {/* Mode toggle + date controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 w-fit">
          {(['day', 'range'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                mode === m ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'day' ? 'Single Night' : 'Date Range'}
            </button>
          ))}
        </div>

        {mode === 'day' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(addDays(date, -1))}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
            >
              ‹ Prev
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
            <button
              onClick={() => setDate(addDays(date, 1))}
              disabled={date >= today()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-30"
            >
              Next ›
            </button>
            {date !== today() && (
              <button
                onClick={() => setDate(today())}
                className="text-xs text-amber-400 hover:text-amber-300 px-2"
              >
                Today
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <button
              onClick={handleRangeFetch}
              disabled={!rangeStart || !rangeEnd}
              className="px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-40 transition-colors"
            >
              View
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : days.length === 0 ? (
        <div className="text-center py-16 border border-slate-800 border-dashed rounded-2xl text-slate-700">
          <p className="text-3xl mb-3">◎</p>
          <p className="text-sm">No sales data for this date.</p>
          <p className="text-xs mt-1 text-slate-800">Import a sales report from the <a href="/uploads" className="text-amber-500/60 hover:text-amber-400">Imports</a> page.</p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
              <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider">Revenue</p>
              <p className={`text-xl sm:text-3xl font-bold mt-1 tabular-nums ${hasRevenue ? 'text-amber-400' : 'text-slate-600'}`}>
                {hasRevenue ? `$${totalRevenue.toFixed(2)}` : '—'}
              </p>
              {!hasRevenue && <p className="text-[10px] text-slate-700 mt-0.5">no price data</p>}
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
              <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider">Items Sold</p>
              <p className="text-xl sm:text-3xl font-bold mt-1 text-slate-100 tabular-nums">{totalQty.toLocaleString()}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">units</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-5">
              <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-wider">Menu Items</p>
              <p className="text-xl sm:text-3xl font-bold mt-1 text-slate-100 tabular-nums">
                {new Set(allItems.map((i) => i.menu_item_id ?? i.raw_name)).size}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">unique items</p>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {([
                { key: 'all',   label: 'All' },
                { key: 'drink', label: 'Drinks' },
                { key: 'food',  label: 'Food' },
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

            {/* Station filter — only show if stations exist */}
            {stationOptions.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex-wrap">
                {stationOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStationFilter(key)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      stationFilter === key ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Per-day sections */}
          <div className="space-y-4">
            {days.map((day) => {
              const items = filterItems(day.items)
              if (items.length === 0) return null
              const dayRevenue = items.reduce((s, i) => s + (i.gross_sales ?? 0), 0)
              const dayHasRevenue = items.some((i) => i.gross_sales != null)

              return (
                <div key={day.date} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Day header */}
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{dateLabel(day.date)}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{day.total_qty} items sold{stationFilter !== 'all' ? ` · ${stationFilter === 'none' ? 'Unassigned' : stationFilter}` : ''}</p>
                    </div>
                    {dayHasRevenue && (
                      <p className="text-lg font-bold text-amber-400 tabular-nums">${dayRevenue.toFixed(2)}</p>
                    )}
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-slate-800/40">
                    {items.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                            {!item.matched && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-600 border border-slate-700 shrink-0">unlinked</span>
                            )}
                          </div>
                          {item.category && (
                            <p className="text-xs text-slate-600 mt-0.5">{item.category}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-slate-100 tabular-nums">×{item.qty_sold}</p>
                          {item.unit_price != null && (
                            <p className="text-xs text-slate-500 tabular-nums">${item.unit_price.toFixed(2)} ea</p>
                          )}
                          {item.gross_sales != null && (
                            <p className="text-xs text-amber-400 tabular-nums">${item.gross_sales.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-slate-800/60">
                          <th className="px-5 py-2.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Item</th>
                          <th className="px-5 py-2.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Category</th>
                          <th className="px-5 py-2.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">Qty Sold</th>
                          <th className="px-5 py-2.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">Unit Price</th>
                          <th className="px-5 py-2.5 text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-200">{item.name}</span>
                                {!item.matched && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-600 border border-slate-700">unlinked</span>
                                )}
                                {item.item_type === 'food' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400">food</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500">{item.category ?? '—'}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-100 tabular-nums">{item.qty_sold}</td>
                            <td className="px-5 py-3 text-right text-slate-400 tabular-nums">
                              {item.unit_price != null ? `$${item.unit_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-amber-400 tabular-nums">
                              {item.gross_sales != null ? `$${item.gross_sales.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {dayHasRevenue && (
                        <tfoot>
                          <tr className="border-t border-slate-800 bg-slate-800/20">
                            <td colSpan={4} className="px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                              Total
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-amber-400 tabular-nums">
                              ${dayRevenue.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
