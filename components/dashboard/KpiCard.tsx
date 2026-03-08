type Accent = 'amber' | 'red' | 'green' | 'blue' | 'slate'

const accentMap: Record<Accent, { border: string; value: string; bg: string; icon: string; glow: string }> = {
  amber: { border: 'border-l-amber-500',   value: 'text-amber-400',   bg: 'from-amber-500/[0.07] to-transparent',   icon: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   glow: 'glow-amber' },
  red:   { border: 'border-l-red-500',     value: 'text-red-400',     bg: 'from-red-500/[0.07] to-transparent',     icon: 'bg-red-500/15 text-red-400 border-red-500/20',         glow: 'glow-red'   },
  green: { border: 'border-l-emerald-500', value: 'text-emerald-400', bg: 'from-emerald-500/[0.07] to-transparent', icon: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', glow: 'glow-green' },
  blue:  { border: 'border-l-blue-500',    value: 'text-blue-400',    bg: 'from-blue-500/[0.07] to-transparent',    icon: 'bg-blue-500/15 text-blue-400 border-blue-500/20',       glow: 'glow-blue'  },
  slate: { border: 'border-l-slate-500',   value: 'text-slate-200',   bg: 'from-slate-500/[0.07] to-transparent',   icon: 'bg-slate-700 text-slate-400 border-slate-700',          glow: ''           },
}

interface Props {
  label: string
  value: string | number
  sub?: string
  accent: Accent
  icon?: string
  note?: string
  gaugeValue?: number
}

function CircleGauge({ value, accent }: { value: number; accent: Accent }) {
  const strokeMap: Record<Accent, string> = {
    amber: '#f59e0b', red: '#ef4444', green: '#10b981', blue: '#3b82f6', slate: '#94a3b8',
  }
  const r = 22
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference
  const color = strokeMap[accent]
  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-200">{value}</span>
    </div>
  )
}

export default function KpiCard({ label, value, sub, accent, icon, note, gaugeValue }: Props) {
  const a = accentMap[accent]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/60 border-l-2 ${a.border} p-5 flex flex-col gap-3 transition-all duration-200 hover:bg-slate-900/90 ${a.glow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${a.bg} pointer-events-none`} />

      {/* Label + Icon */}
      <div className="relative flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        {icon && (
          <span className={`w-6 h-6 flex items-center justify-center rounded-md border text-xs font-bold ${a.icon}`}>
            {icon}
          </span>
        )}
      </div>

      {/* Value row */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1">
          <p className={`text-4xl font-bold tracking-tight leading-none ${a.value}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        </div>
        {gaugeValue !== undefined && (
          <CircleGauge value={gaugeValue} accent={accent} />
        )}
      </div>

      {note && (
        <p className="relative text-[10px] text-slate-600 leading-relaxed border-t border-slate-800/60 pt-2">{note}</p>
      )}
    </div>
  )
}
