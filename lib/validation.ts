export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

export function isPositiveNumber(val: string | number): boolean {
  const n = typeof val === 'string' ? parseFloat(val) : val
  return !isNaN(n) && n >= 0
}

export function parseFloatSafe(val: string): number | null {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

export function parseIntSafe(val: string): number | null {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}
