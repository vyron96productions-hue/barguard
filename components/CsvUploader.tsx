'use client'

import { useState, useRef } from 'react'
import { parseCsvText } from '@/lib/csv'
import type { CsvUploadType } from '@/types'

const REQUIRED_FIELDS: Record<CsvUploadType, string[]> = {
  sales: ['date', 'item_name', 'quantity_sold'],
  inventory: ['count_date', 'item_name', 'quantity_on_hand'],
  purchases: ['purchase_date', 'item_name', 'quantity_purchased'],
}

const OPTIONAL_FIELDS: Record<CsvUploadType, string[]> = {
  sales: ['gross_sales', 'shift', 'employee'],
  inventory: ['unit_type'],
  purchases: ['vendor_name', 'unit_cost', 'unit_type'],
}

const ENDPOINT: Record<CsvUploadType, string> = {
  sales: '/api/uploads/sales',
  inventory: '/api/uploads/inventory',
  purchases: '/api/uploads/purchases',
}

interface Props {
  type: CsvUploadType
  onSuccess: (result: { rows_imported: number; unresolved_aliases: string[] }) => void
}

export default function CsvUploader({ type, onSuccess }: Props) {
  const [headers, setHeaders] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const required = REQUIRED_FIELDS[type]
  const optional = OPTIONAL_FIELDS[type]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    const text = await f.text()
    const { headers: h } = parseCsvText(text)
    setHeaders(h)
    // Auto-map if header names match exactly
    const autoMap: Record<string, string> = {}
    for (const field of [...required, ...optional]) {
      if (h.includes(field)) autoMap[field] = field
    }
    setMapping(autoMap)
  }

  async function handleUpload() {
    if (!file) return
    const missingRequired = required.filter((f) => !mapping[f])
    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.join(', ')}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mapping', JSON.stringify(mapping))
      const res = await fetch(ENDPOINT[type], { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return }
      onSuccess(data)
      setFile(null)
      setHeaders([])
      setMapping({})
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer"
      />

      {headers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Map CSV columns to required fields:</p>
          {[...required.map(f => ({ field: f, req: true })), ...optional.map(f => ({ field: f, req: false }))].map(({ field, req }) => (
            <div key={field} className="flex items-center gap-3">
              <label className="w-44 text-sm">
                {field}
                {req && <span className="text-red-400 ml-1">*</span>}
              </label>
              <select
                value={mapping[field] ?? ''}
                onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 flex-1"
              >
                <option value="">— skip —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  )
}
