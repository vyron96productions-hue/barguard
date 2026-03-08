'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { InventoryUsageSummary } from '@/types'

interface Props {
  summaries: InventoryUsageSummary[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const full = payload[0]?.payload?.fullName ?? label
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 shadow-xl text-xs min-w-[160px]">
      <p className="text-slate-200 font-semibold mb-2">{full}</p>
      {payload.map((p: any) => {
        if (p.dataKey === 'variancePct') {
          const isOver = p.value > 0
          return (
            <div key={p.name} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-0.5 rounded-full bg-white/60" />
              <span className="text-slate-400">Variance:</span>
              <span className={`font-semibold ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOver ? '+' : ''}{p.value?.toFixed(1)}%
              </span>
            </div>
          )
        }
        return (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-400 capitalize">{p.name}:</span>
            <span className="text-slate-200 font-medium">{p.value?.toFixed(1)} oz</span>
          </div>
        )
      })}
    </div>
  )
}

export default function UsageChart({ summaries }: Props) {
  const data = summaries
    .filter((s) => s.expected_usage > 0 || s.actual_usage > 0)
    .map((s) => {
      const variancePct = s.expected_usage > 0
        ? ((s.actual_usage - s.expected_usage) / s.expected_usage) * 100
        : null
      return {
        name: s.inventory_item?.name?.split(' ').slice(-1)[0] ?? '—',
        fullName: s.inventory_item?.name ?? '—',
        expected: parseFloat(s.expected_usage.toFixed(1)),
        actual: parseFloat(s.actual_usage.toFixed(1)),
        variancePct: variancePct !== null ? parseFloat(variancePct.toFixed(1)) : 0,
        status: s.status,
      }
    })

  if (data.length === 0) return null

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Expected vs Actual Usage</h2>
          <p className="text-xs text-slate-500 mt-0.5">Bars in ounces · Line shows variance %</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" /> Expected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-white/40 inline-block rounded-full" /> Variance %
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="oz"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <ReferenceLine yAxisId="pct" y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <Bar yAxisId="oz" dataKey="expected" name="expected" fill="#334155" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="oz" dataKey="actual" name="actual" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="variancePct"
            name="variancePct"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={1.5}
            dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#fff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
