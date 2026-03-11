import StatusBadge from '@/components/StatusBadge'
import { itemCostPerOz } from '@/lib/conversions'
import type { InventoryUsageSummary } from '@/types'

interface Props {
  summaries: InventoryUsageSummary[]
}

export default function RiskTable({ summaries }: Props) {
  const sorted = [...summaries]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 8)

  if (sorted.length === 0) return null

  const maxUsage = Math.max(...sorted.map((s) => Math.max(s.expected_usage, s.actual_usage)), 1)

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Top Risk Items</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ranked by variance magnitude</p>
        </div>
        <span className="text-xs text-slate-600 font-mono">{sorted.length} items</span>
      </div>

      {/* Desktop column headers — hidden on mobile */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-3 border-b border-slate-800/40 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
        <div className="col-span-3">Item</div>
        <div className="col-span-4">Usage Comparison</div>
        <div className="col-span-2 text-right">Variance</div>
        <div className="col-span-2 text-right">Est. Loss</div>
        <div className="col-span-1 text-right">Status</div>
      </div>

      <div className="divide-y divide-slate-800/40">
        {sorted.map((s, i) => {
          const isTopRisk = i < 3
          const expectedPct = (s.expected_usage / maxUsage) * 100
          const actualPct = (s.actual_usage / maxUsage) * 100
          const cpo = itemCostPerOz(s.inventory_item?.cost_per_unit, s.inventory_item?.unit ?? 'oz')
          const estLoss = Math.max(0, s.variance) * cpo

          const actualBarColor =
            s.status === 'critical' ? 'bg-red-500' :
            s.status === 'warning'  ? 'bg-amber-500' : 'bg-emerald-500'

          const actualGlow =
            s.status === 'critical' ? 'shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
            s.status === 'warning'  ? 'shadow-[0_0_6px_rgba(245,158,11,0.4)]' : ''

          const railColor = s.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
          const rowBg = isTopRisk && s.status === 'critical' ? 'bg-red-500/[0.025]' : ''

          return (
            <div key={s.id} className={`relative ${rowBg}`}>
              {isTopRisk && <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${railColor}`} />}

              {/* ── Mobile card layout ── */}
              <div className="sm:hidden px-4 py-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {i === 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{s.inventory_item?.name ?? '—'}</p>
                      {s.inventory_item?.category && (
                        <p className="text-[10px] text-slate-600">{s.inventory_item.category}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {/* Mini usage bars */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-10 shrink-0">Exp.</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `${expectedPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right shrink-0">{s.expected_usage.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-10 shrink-0">Act.</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${actualBarColor} rounded-full ${actualGlow}`} style={{ width: `${actualPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right shrink-0">{s.actual_usage.toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-bold ${s.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)} oz
                    </span>
                    {s.variance_percent !== null && (
                      <span className={`text-xs ml-1 ${Math.abs(s.variance_percent) >= 20 ? 'text-red-500/70' : Math.abs(s.variance_percent) >= 10 ? 'text-amber-500/70' : 'text-slate-600'}`}>
                        ({s.variance_percent > 0 ? '+' : ''}{s.variance_percent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  {estLoss > 0 && (
                    <span className="text-sm font-medium text-red-400/80">~${estLoss.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* ── Desktop table row ── */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-800/30 transition-colors duration-100">
                {/* Item name */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-200 truncate">{s.inventory_item?.name ?? '—'}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{s.inventory_item?.category ?? ''}</p>
                    </div>
                  </div>
                </div>

                {/* Usage bars */}
                <div className="col-span-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-12 text-right shrink-0">Expected</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `${expectedPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-10 shrink-0">{s.expected_usage.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-12 text-right shrink-0">Actual</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${actualBarColor} rounded-full ${actualGlow}`} style={{ width: `${actualPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 w-10 shrink-0">{s.actual_usage.toFixed(1)}</span>
                  </div>
                </div>

                {/* Variance */}
                <div className="col-span-2 text-right">
                  <p className={`text-sm font-bold ${s.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {s.variance > 0 ? '+' : ''}{s.variance.toFixed(1)} oz
                  </p>
                  {s.variance_percent !== null && (
                    <p className={`text-[10px] font-medium mt-0.5 ${
                      Math.abs(s.variance_percent) >= 20 ? 'text-red-500/70' :
                      Math.abs(s.variance_percent) >= 10 ? 'text-amber-500/70' : 'text-slate-600'
                    }`}>
                      {s.variance_percent > 0 ? '+' : ''}{s.variance_percent.toFixed(1)}%
                    </p>
                  )}
                </div>

                {/* Est Loss */}
                <div className="col-span-2 text-right">
                  <p className={`text-sm font-medium ${estLoss > 0 ? 'text-red-400/80' : 'text-slate-600'}`}>
                    {estLoss > 0 ? `~$${estLoss.toFixed(2)}` : '—'}
                  </p>
                  {estLoss > 0 && <p className="text-[10px] text-slate-600">est.</p>}
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-end">
                  <StatusBadge status={s.status} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
