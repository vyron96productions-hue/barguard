import type { InventoryUsageSummary } from '@/types'

interface Action {
  priority: 'high' | 'medium' | 'low'
  text: string
  tag: string
}

function generateActions(summaries: InventoryUsageSummary[]): Action[] {
  const actions: Action[] = []
  const critical = summaries.filter((s) => s.status === 'critical')
  const warning = summaries.filter((s) => s.status === 'warning')

  for (const item of critical.slice(0, 3)) {
    actions.push({
      priority: 'high',
      text: `Investigate ${item.inventory_item?.name ?? 'item'} — ${item.variance_percent?.toFixed(0) ?? '?'}% variance detected`,
      tag: 'Investigate',
    })
  }

  if (critical.length > 1) {
    actions.push({ priority: 'high', text: 'Conduct full physical recount of all critical items', tag: 'Recount' })
  }

  if (critical.some((s) => (s.variance_percent ?? 0) > 100)) {
    actions.push({ priority: 'high', text: 'Check recipe mappings for extreme variance items', tag: 'Recipes' })
  }

  for (const item of warning.slice(0, 2)) {
    actions.push({
      priority: 'medium',
      text: `Review pour standards for ${item.inventory_item?.name ?? 'item'}`,
      tag: 'Pour Control',
    })
  }

  actions.push({ priority: 'medium', text: 'Cross-reference POS sales data with pour logs', tag: 'Audit' })

  if (critical.length > 0) {
    actions.push({ priority: 'medium', text: 'Brief staff on over-pour policy and jigger use', tag: 'Training' })
  }

  return actions.slice(0, 7)
}

const tagStyle: Record<string, string> = {
  high:   'bg-red-500/10 text-red-400 border border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  low:    'bg-slate-700/50 text-slate-400 border border-slate-700',
}

const dotStyle: Record<string, string> = {
  high:   'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  medium: 'bg-amber-500',
  low:    'bg-slate-500',
}

interface Props {
  summaries: InventoryUsageSummary[]
}

export default function NextActionsPanel({ summaries }: Props) {
  const actions = generateActions(summaries)
  const high = actions.filter((a) => a.priority === 'high')
  const medium = actions.filter((a) => a.priority === 'medium')

  function ActionItem({ action }: { action: Action }) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800/60 hover:bg-slate-800/60 transition-colors">
        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle[action.priority]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 leading-relaxed">{action.text}</p>
        </div>
        <span className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full ${tagStyle[action.priority]}`}>
          {action.tag}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-slate-800/60">
        <h2 className="text-sm font-semibold text-slate-100">Next Actions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Operational recommendations</p>
      </div>

      <div className="p-4 space-y-4">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p className="text-xs">Run calculations to generate actions</p>
          </div>
        ) : (
          <>
            {high.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-red-500/70 uppercase tracking-widest px-1">High Priority</p>
                {high.map((action, i) => <ActionItem key={i} action={action} />)}
              </div>
            )}
            {medium.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest px-1">Medium Priority</p>
                {medium.map((action, i) => <ActionItem key={i} action={action} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
