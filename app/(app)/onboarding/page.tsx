'use client'

import { useState, useRef } from 'react'
import type { ScanType } from '@/lib/document-extraction'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedItem {
  raw_item_name: string
  unit_cost: number
  unit_type: string | null
  units_per_package: number | null
  confidence?: 'high' | 'medium' | 'low'
}

interface ReviewRow extends ExtractedItem {
  id: string           // local key
  skip: boolean
  edited_cost: string  // string for input binding
}

type Step = 'choose' | 'upload' | 'map-csv' | 'review' | 'done'
type Mode = 'scan' | 'csv'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idSeq = 0
function makeId() { return `r${++idSeq}` }

function confidenceDot(c?: 'high' | 'medium' | 'low') {
  if (c === 'high') return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="High confidence" />
  if (c === 'medium') return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Medium confidence" />
  return <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" title="Low confidence" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('choose')
  const [mode, setMode] = useState<Mode>('scan')
  const [scanType, setScanType] = useState<ScanType>('liquor')

  // Scan state
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string | null>(null)

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvSample, setCsvSample] = useState<Record<string, string> | null>(null)
  const [csvRowCount, setCsvRowCount] = useState(0)
  const [mapItemName, setMapItemName] = useState('')
  const [mapUnitCost, setMapUnitCost] = useState('')
  const [mapUnitType, setMapUnitType] = useState('')
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)

  // Review state
  const [rows, setRows] = useState<ReviewRow[]>([])

  // Apply state
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ updated: number; unresolved: string[] } | null>(null)

  const scanInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // ── Step: Choose mode ──────────────────────────────────────────────────────

  function handleChoose(m: Mode) {
    setMode(m)
    setStep('upload')
    setScanError(null)
    setCsvError(null)
  }

  // ── Step: Scan upload ──────────────────────────────────────────────────────

  async function handleScanUpload() {
    if (!scanFile) return
    setScanning(true)
    setScanError(null)
    try {
      const fd = new FormData()
      fd.append('file', scanFile)
      fd.append('scan_type', scanType)
      const res = await fetch('/api/onboarding/scan-prices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setScanError(data.error ?? 'Scan failed'); return }

      setVendorName(data.vendor_name ?? null)
      const extracted: ExtractedItem[] = data.items ?? []
      setRows(extracted.map((item) => ({
        ...item,
        id: makeId(),
        skip: false,
        edited_cost: String(item.unit_cost),
      })))
      setStep('review')
    } catch {
      setScanError('Network error. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  // ── Step: CSV headers ──────────────────────────────────────────────────────

  async function handleCsvFileSelect(file: File) {
    setCsvFile(file)
    setCsvLoading(true)
    setCsvError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/onboarding/csv-headers', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCsvError(data.error ?? 'Failed to read CSV'); return }
      setCsvHeaders(data.headers ?? [])
      setCsvSample(data.sample ?? null)
      setCsvRowCount(data.row_count ?? 0)

      // Auto-guess columns
      const hdrs: string[] = data.headers ?? []
      const guess = (keywords: string[]) =>
        hdrs.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) ?? ''
      setMapItemName(guess(['item', 'name', 'product', 'description', 'desc']))
      setMapUnitCost(guess(['cost', 'price', 'unit cost', 'unit_cost', 'rate']))
      setMapUnitType(guess(['unit', 'uom', 'type']))

      setStep('map-csv')
    } catch {
      setCsvError('Failed to read CSV. Make sure it is a valid CSV file.')
    } finally {
      setCsvLoading(false)
    }
  }

  async function handleCsvMap() {
    if (!csvFile || !mapItemName || !mapUnitCost) return
    setCsvLoading(true)
    setCsvError(null)
    try {
      const mapping: Record<string, string> = { item_name: mapItemName, unit_cost: mapUnitCost }
      if (mapUnitType) mapping.unit_type = mapUnitType
      const fd = new FormData()
      fd.append('file', csvFile)
      fd.append('mapping', JSON.stringify(mapping))
      const res = await fetch('/api/onboarding/csv-prices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCsvError(data.error ?? 'Failed to process CSV'); return }
      const extracted: ExtractedItem[] = data.items ?? []
      setRows(extracted.map((item) => ({
        ...item,
        id: makeId(),
        skip: false,
        edited_cost: String(item.unit_cost),
      })))
      setStep('review')
    } catch {
      setCsvError('Network error. Please try again.')
    } finally {
      setCsvLoading(false)
    }
  }

  // ── Step: Apply prices ─────────────────────────────────────────────────────

  async function handleApply() {
    const active = rows.filter((r) => !r.skip)
    if (active.length === 0) return
    setApplying(true)
    try {
      const entries = active.map((r) => ({
        raw_item_name: r.raw_item_name,
        unit_cost: parseFloat(r.edited_cost) || r.unit_cost,
        units_per_package: r.units_per_package,
      }))
      const res = await fetch('/api/onboarding/apply-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const data = await res.json()
      setApplyResult(data)
      setStep('done')
    } catch {
      alert('Network error applying prices.')
    } finally {
      setApplying(false)
    }
  }

  function resetAll() {
    setStep('choose')
    setScanFile(null)
    setCsvFile(null)
    setCsvHeaders([])
    setRows([])
    setApplyResult(null)
    setVendorName(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Set Up Pricing</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Import prices from past invoices or a spreadsheet — no purchase records created, no effect on stock or P&amp;L.
        </p>
      </div>

      {/* ── Step: Choose ──────────────────────────────────────────────────── */}
      {step === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleChoose('scan')}
            className="group bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl p-6 text-left transition-all"
          >
            <div className="text-2xl mb-3">📷</div>
            <p className="font-semibold text-gray-100 mb-1">Scan an Invoice</p>
            <p className="text-sm text-gray-500">Upload a photo or PDF of any invoice. AI reads the item names and prices automatically.</p>
          </button>
          <button
            onClick={() => handleChoose('csv')}
            className="group bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl p-6 text-left transition-all"
          >
            <div className="text-2xl mb-3">📋</div>
            <p className="font-semibold text-gray-100 mb-1">Upload a Spreadsheet</p>
            <p className="text-sm text-gray-500">Upload a CSV with item names and prices. You pick which column is which.</p>
          </button>
        </div>
      )}

      {/* ── Step: Scan upload ─────────────────────────────────────────────── */}
      {step === 'upload' && mode === 'scan' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
            <h2 className="font-semibold text-gray-100">Scan Invoice</h2>
          </div>

          {/* Invoice type */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Invoice type</label>
            <div className="flex gap-2">
              {(['liquor', 'food', 'supplies'] as ScanType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setScanType(t)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                    scanType === t ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => scanInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setScanFile(f) }}
            className="border-2 border-dashed border-gray-700 hover:border-amber-500/50 rounded-xl p-10 text-center cursor-pointer transition-colors"
          >
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setScanFile(f) }}
            />
            {scanFile ? (
              <div>
                <p className="text-gray-100 font-medium">{scanFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(scanFile.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm">Drop invoice here or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP, PDF · max 20 MB</p>
              </div>
            )}
          </div>

          {scanError && <p className="text-sm text-red-400">{scanError}</p>}

          <button
            onClick={handleScanUpload}
            disabled={!scanFile || scanning}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm transition-colors"
          >
            {scanning ? 'Reading invoice…' : 'Extract Prices'}
          </button>
        </div>
      )}

      {/* ── Step: CSV upload ──────────────────────────────────────────────── */}
      {step === 'upload' && mode === 'csv' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
            <h2 className="font-semibold text-gray-100">Upload CSV</h2>
          </div>

          <div
            onClick={() => csvInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvFileSelect(f) }}
            className="border-2 border-dashed border-gray-700 hover:border-amber-500/50 rounded-xl p-10 text-center cursor-pointer transition-colors"
          >
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFileSelect(f) }}
            />
            {csvLoading ? (
              <p className="text-gray-400 text-sm">Reading file…</p>
            ) : csvFile ? (
              <div>
                <p className="text-gray-100 font-medium">{csvFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{csvRowCount} rows detected</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm">Drop CSV here or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">CSV only · max 10 MB</p>
              </div>
            )}
          </div>

          {csvError && <p className="text-sm text-red-400">{csvError}</p>}
        </div>
      )}

      {/* ── Step: Map CSV columns ─────────────────────────────────────────── */}
      {step === 'map-csv' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
            <h2 className="font-semibold text-gray-100">Map Columns</h2>
          </div>

          <p className="text-sm text-gray-400">
            Tell us which columns contain the item name and price.
            {csvFile && <span className="text-gray-600 ml-1">({csvRowCount} rows in {csvFile.name})</span>}
          </p>

          {/* Sample preview */}
          {csvSample && csvHeaders.length > 0 && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto">
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Sample row</p>
              <table className="text-xs text-gray-400 w-full">
                <thead>
                  <tr>{csvHeaders.map((h) => <th key={h} className="text-left pr-4 text-gray-600 font-medium pb-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>{csvHeaders.map((h) => <td key={h} className="pr-4 text-gray-300">{csvSample[h] ?? '—'}</td>)}</tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Item Name column <span className="text-red-400">*</span></label>
              <select
                value={mapItemName}
                onChange={(e) => setMapItemName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">— select —</option>
                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Price column <span className="text-red-400">*</span></label>
              <select
                value={mapUnitCost}
                onChange={(e) => setMapUnitCost(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">— select —</option>
                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Unit Type column <span className="text-gray-600">(optional)</span></label>
              <select
                value={mapUnitType}
                onChange={(e) => setMapUnitType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">— skip —</option>
                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {csvError && <p className="text-sm text-red-400">{csvError}</p>}

          <button
            onClick={handleCsvMap}
            disabled={!mapItemName || !mapUnitCost || csvLoading}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm transition-colors"
          >
            {csvLoading ? 'Processing…' : 'Preview Prices'}
          </button>
        </div>
      )}

      {/* ── Step: Review ──────────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
              <div>
                <h2 className="font-semibold text-gray-100">Review Prices</h2>
                {vendorName && <p className="text-xs text-gray-500 mt-0.5">From: {vendorName}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-500">{rows.filter((r) => !r.skip).length} of {rows.length} selected</p>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-400">
              Only inventory items that already exist in your system will be matched.
              Prices are applied immediately — no stock or purchase records will be created.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No priced items were found in this document.</p>
              <button onClick={resetAll} className="mt-3 text-amber-500 text-sm hover:text-amber-400">Try another file</button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_120px_80px_36px] gap-2 px-4 py-2.5 bg-gray-950 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <span>Item</span>
                <span>Price</span>
                <span>Unit</span>
                <span></span>
              </div>

              <div className="divide-y divide-gray-800/60">
                {rows.map((row, i) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-[1fr_120px_80px_36px] gap-2 px-4 py-3 items-center transition-opacity ${
                      row.skip ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Item name */}
                    <div className="flex items-center gap-2 min-w-0">
                      {row.confidence && confidenceDot(row.confidence)}
                      <span className="text-sm text-gray-200 truncate">{row.raw_item_name}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-1">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.edited_cost}
                        onChange={(e) => setRows((prev) => prev.map((r, ri) =>
                          ri === i ? { ...r, edited_cost: e.target.value } : r
                        ))}
                        disabled={row.skip}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                      />
                    </div>

                    {/* Unit */}
                    <span className="text-xs text-gray-500 truncate">{row.unit_type ?? '—'}</span>

                    {/* Skip toggle */}
                    <button
                      onClick={() => setRows((prev) => prev.map((r, ri) => ri === i ? { ...r, skip: !r.skip } : r))}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-colors ${
                        row.skip
                          ? 'bg-gray-800 text-gray-600 hover:text-gray-400'
                          : 'bg-gray-800 text-gray-400 hover:text-red-400'
                      }`}
                      title={row.skip ? 'Include this item' : 'Skip this item'}
                    >
                      {row.skip ? '+' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex gap-3 justify-end">
              <button onClick={resetAll} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying || rows.filter((r) => !r.skip).length === 0}
                className="px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm transition-colors"
              >
                {applying ? 'Applying…' : `Apply ${rows.filter((r) => !r.skip).length} Price${rows.filter((r) => !r.skip).length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Done ────────────────────────────────────────────────────── */}
      {step === 'done' && applyResult && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <span className="text-emerald-400 text-xl">✓</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-100">
              {applyResult.updated} price{applyResult.updated !== 1 ? 's' : ''} updated
            </p>
            <p className="text-sm text-gray-500 mt-1">No purchase records were created. Stock levels are unchanged.</p>
          </div>

          {applyResult.unresolved.length > 0 && (
            <div className="text-left bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {applyResult.unresolved.length} item{applyResult.unresolved.length !== 1 ? 's' : ''} not matched
              </p>
              <p className="text-xs text-gray-600 mb-2">
                These names weren&apos;t found in your inventory. Add them in Inventory Items and try again, or add an alias.
              </p>
              <ul className="space-y-0.5">
                {applyResult.unresolved.map((name) => (
                  <li key={name} className="text-xs text-gray-400">{name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm transition-colors"
            >
              Import Another Invoice
            </button>
            <a
              href="/inventory-items"
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              View Inventory Items
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
