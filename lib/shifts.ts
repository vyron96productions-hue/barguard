// ─── Shift preset definitions and time-window resolution ─────────────────────
//
// This module is intentionally free of server-only imports so it can be used
// from both client components (app/page.tsx) and API routes.

export interface ShiftPreset {
  id: string          // stable identifier, e.g. 'dinner'
  label: string       // display label shown in the UI
  startTime: string   // 'HH:MM' 24-hour clock
  endTime: string     // 'HH:MM' 24-hour clock
  /** true when endTime < startTime (shift crosses midnight into the next calendar day) */
  isOvernight: boolean
}

/**
 * Built-in shift presets. The times here are intentionally typical bar/restaurant
 * defaults — operators can override them via custom shifts stored in the DB.
 *
 * Extend this array to add new built-in presets; the IDs must stay stable
 * because they are used as React keys and in URL params.
 */
export const SHIFT_PRESETS: ShiftPreset[] = [
  { id: 'morning',    label: 'Morning',    startTime: '06:00', endTime: '11:00', isOvernight: false },
  { id: 'lunch',      label: 'Lunch',      startTime: '11:00', endTime: '15:00', isOvernight: false },
  { id: 'happy_hour', label: 'Happy Hour', startTime: '15:00', endTime: '19:00', isOvernight: false },
  { id: 'dinner',     label: 'Dinner',     startTime: '17:00', endTime: '21:00', isOvernight: false },
  { id: 'late_night', label: 'Late Night', startTime: '21:00', endTime: '02:00', isOvernight: true  },
  { id: 'full_day',   label: 'Full Day',   startTime: '00:00', endTime: '23:59', isOvernight: false },
]

export interface ResolvedShiftWindow {
  /** Absolute UTC start of the shift as ISO 8601 */
  shiftStart: string
  /** Absolute UTC end of the shift as ISO 8601 (or current time when useCurrentTimeAsEnd = true) */
  shiftEnd: string
  /** YYYY-MM-DD date for DB period_start */
  periodStart: string
  /** YYYY-MM-DD date for DB period_end (next day for overnight shifts) */
  periodEnd: string
  /** Human-readable label: "Dinner · Mon, Mar 9, 2026 · 5:00 PM – 9:00 PM" */
  displayLabel: string
  /** Whether the end was capped to the current time */
  isLiveEnd: boolean
}

/**
 * Convert a shift preset + service date to an absolute datetime window.
 *
 * NOTE: This function uses the browser's local timezone via the Date constructor,
 * which is correct when called client-side. Server-side calls will use the
 * Node.js process timezone (UTC on most cloud platforms) — pass pre-built
 * ISO strings from the client in that case.
 *
 * @param preset              The shift preset to resolve
 * @param serviceDate         YYYY-MM-DD — the calendar date the shift "belongs to".
 *                            For overnight shifts (Late Night), this is the start night.
 * @param useCurrentTimeAsEnd If true, shiftEnd is set to now() instead of preset.endTime.
 *                            Use for "today's shift so far" calculations.
 */
export function resolveShiftWindow(
  preset: ShiftPreset,
  serviceDate: string,
  useCurrentTimeAsEnd = false,
): ResolvedShiftWindow {
  const [y, mo, d] = serviceDate.split('-').map(Number)

  const [sh, sm] = preset.startTime.split(':').map(Number)
  const shiftStart = new Date(y, mo - 1, d, sh, sm, 0, 0)

  const [eh, em] = preset.endTime.split(':').map(Number)
  // Overnight shifts end on the next calendar day
  const endDayOffset = preset.isOvernight ? 1 : 0
  const nominalEnd = new Date(y, mo - 1, d + endDayOffset, eh, em, 0, 0)
  const shiftEnd = useCurrentTimeAsEnd ? new Date() : nominalEnd

  // Date strings for DB queries
  const periodStart = serviceDate
  const periodEnd = preset.isOvernight ? toIsoDate(new Date(y, mo - 1, d + 1)) : serviceDate

  // Human-readable label
  const datePart = new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
  const startPart = fmt12h(shiftStart)
  const endPart = useCurrentTimeAsEnd ? 'Now' : fmt12h(nominalEnd)
  const displayLabel = `${preset.label} · ${datePart} · ${startPart} – ${endPart}`

  return {
    shiftStart: shiftStart.toISOString(),
    shiftEnd: shiftEnd.toISOString(),
    periodStart,
    periodEnd,
    displayLabel,
    isLiveEnd: useCurrentTimeAsEnd,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmt12h(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
