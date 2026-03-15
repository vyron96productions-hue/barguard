'use client'

import { useEffect, useState } from 'react'
import { UNIT_LABELS, formatQty } from '@/lib/conversions'
import type { ReorderAlert } from '@/app/api/reorder-alerts/route'

export default function ReorderAlerts() {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetch('/api/reorder-alerts')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setAlerts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || alerts.length === 0) return null

  const unitLabel = (unit: string) => UNIT_LABELS[unit] ?? unit

  return (
    <div className="rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-amber-500/[0.03] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2L2 13h12L8 2zm0 4v3m0 2.5h.01" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-medium">Reorder Alerts</p>
          <p className="text-sm font-semibold text-amber-200/80 leading-snug">
            {alerts.length} item{alerts.length !== 1 ? 's' : ''} below reorder level
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-amber-500/40 shrink-0 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Item list */}
      {!collapsed && (
        <div className="divide-y divide-amber-500/10 border-t border-amber-500/15">
          {alerts.map((alert) => {
            const neverCounted = alert.current_qty === null
            const qty = alert.current_qty ?? 0
            const urgency = neverCounted ? 'unknown' : qty === 0 ? 'critical' : 'low'

            return (
              <div key={alert.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                {/* Urgency dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  urgency === 'critical' ? 'bg-red-400' :
                  urgency === 'unknown'  ? 'bg-slate-500' :
                  'bg-amber-400'
                }`} />

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{alert.name}</p>
                  {alert.category && (
                    <p className="text-[10px] text-slate-500 capitalize">{alert.category}</p>
                  )}
                </div>

                {/* Current qty */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold tabular-nums ${
                    urgency === 'critical' ? 'text-red-400' :
                    urgency === 'unknown'  ? 'text-slate-500' :
                    'text-amber-400'
                  }`}>
                    {neverCounted ? '—' : `${formatQty(qty, alert.unit)} ${unitLabel(alert.unit)}`}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    reorder at {alert.reorder_level} {unitLabel(alert.unit)}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Footer link */}
          <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <p className="text-[10px] text-slate-600">Based on most recent stock count</p>
            <a
              href="/inventory-items"
              className="text-[10px] text-amber-500/60 hover:text-amber-400 transition-colors font-medium"
            >
              Manage items →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
