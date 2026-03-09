import type { PerformanceData } from '@/app/api/reports/performance/route'

interface Props {
  data: PerformanceData
}

function fmt$(n: number): string {
  return n >= 1000
    ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    : `$${n.toFixed(2).replace(/\.00$/, '')}`
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

interface MetricProps {
  label:   string
  value:   string
  note?:   string
  dimmed?: boolean  // true when value is a fallback/unavailable state
}

function Metric({ label, value, note, dimmed }: MetricProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none tabular-nums ${dimmed ? 'text-slate-600' : 'text-slate-100'}`}>
        {value}
      </p>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none mt-1">
        {label}
      </p>
      {note && (
        <p className="text-[10px] text-slate-700 leading-tight mt-0.5">{note}</p>
      )}
    </div>
  )
}

function Divider() {
  return <div className="hidden sm:block w-px self-stretch bg-slate-800/80" />
}

export default function PerformanceSummaryCard({ data }: Props) {
  const {
    total_revenue, total_covers, covers_source,
    total_items_sold, transaction_count, transaction_count_source,
    avg_spend_per_guest, avg_check,
  } = data

  const hasRevenue = total_revenue != null && total_revenue > 0
  const hasCovers  = total_covers  != null && total_covers  > 0

  const revenueValue      = hasRevenue ? fmt$(total_revenue!) : '—'
  const coversValue       = hasCovers  ? fmtCount(total_covers!) : '—'
  const avgSpendValue     = avg_spend_per_guest != null ? `$${avg_spend_per_guest.toFixed(2)}` : '—'
  const txValue           = fmtCount(transaction_count)
  const avgCheckValue     = avg_check != null ? `$${avg_check.toFixed(2)}` : '—'
  const itemsValue        = fmtCount(total_items_sold)

  const coversNote     = covers_source === 'none'   ? 'not tracked by POS' : undefined
  const txNote         = transaction_count_source === 'approx' ? 'approx — no check IDs' : undefined

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-slate-800/60">
        <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" d="M3 12V7m3 5V4m3 8V6m3 6V2" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Business Performance</p>
      </div>

      {/* Metrics grid */}
      <div className="px-4 sm:px-5 py-4">
        {/* Mobile: 2-col grid  |  Desktop: single flex row with dividers */}
        <div className="hidden sm:flex items-start gap-0 divide-x divide-slate-800/80">
          <div className="flex-1 px-5 first:pl-0 last:pr-0">
            <Metric label="Revenue" value={revenueValue} dimmed={!hasRevenue} />
          </div>
          <div className="flex-1 px-5">
            <Metric label="Guests Served" value={coversValue} note={coversNote} dimmed={!hasCovers} />
          </div>
          <div className="flex-1 px-5">
            <Metric
              label="Avg / Guest"
              value={avgSpendValue}
              note={!hasCovers ? 'requires guest data' : !hasRevenue ? 'requires revenue data' : undefined}
              dimmed={avg_spend_per_guest == null}
            />
          </div>
          <div className="flex-1 px-5">
            <Metric label="Transactions" value={txValue} note={txNote} />
          </div>
          <div className="flex-1 px-5">
            <Metric
              label="Avg Check"
              value={avgCheckValue}
              note={!hasRevenue ? 'requires revenue data' : undefined}
              dimmed={avg_check == null}
            />
          </div>
          <div className="flex-1 px-5 last:pr-0">
            <Metric label="Items Sold" value={itemsValue} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:hidden">
          <Metric label="Revenue"      value={revenueValue}  dimmed={!hasRevenue} />
          <Metric label="Guests"       value={coversValue}   note={coversNote} dimmed={!hasCovers} />
          <Metric label="Avg / Guest"  value={avgSpendValue} dimmed={avg_spend_per_guest == null} />
          <Metric label="Transactions" value={txValue}       note={txNote} />
          <Metric label="Avg Check"    value={avgCheckValue} dimmed={avg_check == null} />
          <Metric label="Items Sold"   value={itemsValue} />
        </div>
      </div>
    </div>
  )
}
