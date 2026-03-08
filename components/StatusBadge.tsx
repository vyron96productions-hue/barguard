import type { VarianceStatus } from '@/types'

const config: Record<VarianceStatus, { label: string; pill: string; dot: string; pulse: boolean }> = {
  normal:   { label: 'Healthy',  pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', pulse: false },
  warning:  { label: 'Warning',  pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',       dot: 'bg-amber-400',  pulse: false },
  critical: { label: 'Critical', pill: 'bg-red-500/10 text-red-400 border border-red-500/20',             dot: 'bg-red-500',    pulse: true  },
}

export default function StatusBadge({ status }: { status: VarianceStatus }) {
  const { label, pill, dot, pulse } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  )
}
