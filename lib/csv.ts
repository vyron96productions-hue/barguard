import Papa from 'papaparse'

export interface ParsedCsvResult {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

export function parseCsvText(text: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  })

  const errors: string[] = result.errors.map((e) => `Row ${e.row}: ${e.message}`)
  const headers = result.meta.fields ?? []

  return { headers, rows: result.data, errors }
}

export function validateRequiredColumns(
  headers: string[],
  mapping: Record<string, string>
): string[] {
  const missing: string[] = []
  for (const [field, csvCol] of Object.entries(mapping)) {
    if (csvCol && !headers.includes(csvCol)) {
      missing.push(`Mapped column "${csvCol}" for field "${field}" not found in CSV`)
    }
  }
  return missing
}

export function extractMappedValue(
  row: Record<string, string>,
  mapping: Record<string, string>,
  field: string
): string {
  const col = mapping[field]
  return col ? (row[col] ?? '') : ''
}
