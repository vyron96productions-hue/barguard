'use client'

import { SHIFT_PRESETS, type ShiftPreset } from '@/lib/shifts'

interface Props {
  /** 'daterange' | shift preset id */
  mode: string
  serviceDate: string
  useCurrentTime: boolean
  onModeChange: (mode: string) => void
  onServiceDateChange: (date: string) => void
  onUseCurrentTimeChange: (v: boolean) => void
}

const DATE_RANGE_ID = 'daterange'

/** 'HH:MM' → '6 AM' / '11 AM' / '9 PM' */
function fmtHHMM(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function shiftHint(preset: ShiftPreset): string {
  if (preset.id === 'full_day') return 'All day'
  return `${fmtHHMM(preset.startTime)} – ${fmtHHMM(preset.endTime)}`
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path strokeLinecap="round" d="M5 1v2M11 1v2M2 7h12" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
      <circle cx="8" cy="8" r="6" />
      <path strokeLinecap="round" d="M8 5v3l2 2" />
    </svg>
  )
}

export default function ShiftSelector({
  mode,
  serviceDate,
  useCurrentTime,
  onModeChange,
  onServiceDateChange,
  onUseCurrentTimeChange,
}: Props) {
  const isShift = mode !== DATE_RANGE_ID

  return (
    <div className="flex flex-col gap-3">

      {/* ── Pill track ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5 pb-0.5">
        <div className="flex items-stretch gap-1.5 min-w-max">

          {/* Date Range card */}
          <button
            onClick={() => onModeChange(DATE_RANGE_ID)}
            className={`group flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 border min-w-[72px] ${
              mode === DATE_RANGE_ID
                ? 'bg-slate-700/70 border-slate-600/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700/60 hover:bg-slate-800/30'
            }`}
          >
            <CalendarIcon className={`w-3.5 h-3.5 transition-colors ${mode === DATE_RANGE_ID ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-500'}`} />
            <span className="leading-none mt-0.5">Date</span>
            <span className={`text-[9px] leading-none ${mode === DATE_RANGE_ID ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-600'}`}>Range</span>
          </button>

          {/* Shift preset cards */}
          {SHIFT_PRESETS.map((preset) => {
            const active = mode === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => onModeChange(preset.id)}
                className={`group flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-xl transition-all duration-150 border min-w-[72px] ${
                  active
                    ? 'bg-amber-500/12 border-amber-500/35 shadow-[0_0_14px_rgba(245,158,11,0.10),inset_0_1px_0_rgba(245,158,11,0.08)]'
                    : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/30 hover:border-slate-700/60'
                }`}
              >
                <span className={`text-xs font-semibold leading-none transition-colors ${active ? 'text-amber-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {preset.label}
                </span>
                <span className={`text-[9px] leading-none transition-colors ${active ? 'text-amber-500/60' : 'text-slate-700 group-hover:text-slate-600'}`}>
                  {shiftHint(preset)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Shift secondary controls ────────────────────────────────────────── */}
      {isShift && (
        <div className="flex items-center gap-2 flex-wrap">

          {/* Service date chip */}
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2 hover:border-slate-700/70 transition-colors">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium shrink-0">Date</span>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => onServiceDateChange(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none w-[7.5rem] cursor-pointer"
            />
          </div>

          {/* To Now toggle */}
          <button
            onClick={() => onUseCurrentTimeChange(!useCurrentTime)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 ${
              useCurrentTime
                ? 'bg-amber-500/12 border-amber-500/35 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.08)]'
                : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700/60'
            }`}
          >
            {useCurrentTime
              ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              : <ClockIcon className="w-3.5 h-3.5 shrink-0" />
            }
            {useCurrentTime ? 'To Now' : 'To preset end time'}
          </button>

        </div>
      )}
    </div>
  )
}
