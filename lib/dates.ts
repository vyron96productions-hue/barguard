/**
 * Date utilities for consistent local-date handling.
 *
 * The problem: On Vercel (UTC server), `new Date().toISOString().slice(0,10)`
 * returns UTC date — which flips to "tomorrow" after ~8pm US Eastern Time.
 *
 * The fix:
 *  - Interactive routes (stock counts, purchases, expenses) accept `local_date`
 *    from the browser — the client sends `new Date().toLocaleDateString('en-CA')`.
 *  - Background routes (cron, webhooks, reports) use UTC; being off by a few
 *    hours at midnight is acceptable for server-side aggregations.
 *
 * Never use `new Date().toISOString().slice(0, 10)` in routes that write
 * date fields tied to a bar's operational day. Use localDateFromClient() instead.
 */

/** YYYY-MM-DD in UTC. Acceptable for background jobs / server-only date math. */
export function utcDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Returns a validated client-provided date (YYYY-MM-DD) or falls back to UTC.
 * Use this in every API route that accepts a date from the browser.
 *
 * @example
 *   const { count_date } = await req.json()
 *   const today = localDateFromClient(count_date)
 */
export function localDateFromClient(clientDate?: string | null): string {
  if (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) return clientDate
  return utcDateStr()
}

/**
 * Returns YYYY-MM-DD for N days before a given date string.
 * Uses noon UTC internally to avoid DST boundary issues.
 */
export function daysBeforeDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * Returns YYYY-MM-DD for yesterday in UTC.
 * Used by POS auto-sync to include boundary hours near midnight.
 */
export function yesterdayUtc(): string {
  return daysBeforeDate(utcDateStr(), 1)
}
