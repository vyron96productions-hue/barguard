'use client'

import { useState, useRef } from 'react'
import type { ScanType } from '@/lib/document-extraction'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedItem {
  raw_item_name:     string
  unit_cost:         number | null
  unit_type:         string | null
  units_per_package: number | null
  quantity:          number | null
  confidence?:       'high' | 'medium' | 'low'
  is_new:            boolean
}

interface ReviewRow extends ExtractedItem {
  id:              string
  skip:            boolean
  edited_cost:     string   // $ input
  edited_qty:      string   // qty on hand input
  edited_unit:     string   // unit (editable for new items)
  edited_type:     string   // item_type (editable for new items)
}

type Step = 'choose' | 'upload' | 'map-csv' | 'review' | 'done'
type Mode = 'scan' | 'csv'

interface ApplyResult {
  updated:   number
  created:   number
  stock_set: number
  failed:    string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idSeq = 0
function makeId() { return `r${++idSeq}` }

function confidenceDot(c?: 'high' | 'medium' | 'low') {
  if (c === 'high')   return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block" title="High confidence" />
  if (c === 'medium') return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 inline-block" title="Medium confidence" />
  return                     <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 inline-block" title="Low confidence" />
}

function defaultUnit(scanType: ScanType): string {
  if (scanType === 'food')     return 'lb'
  if (scanType === 'supplies') return 'each'
  return 'bottle'
}

function defaultItemType(scanType: ScanType): string {
  return scanType === 'food' ? 'food' : 'beverage'
}

function toReviewRow(item: ExtractedItem, scanType: ScanType): ReviewRow {
  return {
    ...item,
    id:           makeId(),
    skip:         false,
    edited_cost:  item.unit_cost != null ? String(item.unit_cost) : '',
    edited_qty:   item.quantity != null  ? String(item.quantity)  : '',
    edited_unit:  item.unit_type ?? defaultUnit(scanType),
    edited_type:  defaultItemType(scanType),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step,     setStep]     = useState<Step>('choose')
  const [mode,     setMode]     = useState<Mode>('scan')
  const [scanType, setScanType] = useState<ScanType>('liquor')

  // Scan state
  const [scanFile,   setScanFile]   = useState<File | null>(null)
  const [scanning,   setScanning]   = useState(false)
  const [scanError,  setScanError]  = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string | null>(null)

  // CSV state
  const [csvFile,     setCsvFile]     = useState<File | null>(null)
  const [csvHeaders,  setCsvHeaders]  = useState<string[]>([])
  const [csvSample,   setCsvSample]   = useState<Record<string, string> | null>(null)
  const [csvRowCount, setCsvRowCount] = useState(0)
  const [mapItemName, setMapItemName] = useState('')
  const [mapUnitCost, setMapUnitCost] = useState('')
  const [mapQty,      setMapQty]      = useState('')
  const [mapUnitType, setMapUnitType] = useState('')
  const [csvLoading,  setCsvLoading]  = useState(false)
  const [csvError,    setCsvError]    = useState<string | null>(null)

  // Review state
  const [rows, setRows] = useState<ReviewRow[]>([])

  // Apply state
  const [applying,     setApplying]     = useState(false)
  const [applyResult,  setApplyResult]  = useState<ApplyResult | null>(null)

  const scanInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef  = useRef<HTMLInputElement>(null)

  function updateRow(i: number, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r, ri) => ri === i ? { ...r, ...patch } : r))
  }

  // ── Choose ──────────────────────────────────────────────────────────────────

  function handleChoose(m: Mode) {
    setMode(m)
    setStep('upload')
    setScanError(null)
    setCsvError(null)
  }

  // ── Scan upload ─────────────────────────────────────────────────────────────

  async function handleScanUpload() {
    if (!scanFile) return
    setScanning(true)
    setScanError(null)
    try {
      const fd = new FormData()
      fd.append('file', scanFile)
      fd.append('scan_type', scanType)
      const res  = await fetch('/api/onboarding/scan-prices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setScanError(data.error ?? 'Scan failed'); return }

      setVendorName(data.vendor_name ?? null)
      setRows((data.items ?? []).map((item: ExtractedItem) => toReviewRow(item, scanType)))
      setStep('review')
    } catch {
      setScanError('Network error. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  // ── CSV file select → detect headers ────────────────────────────────────────

  async function handleCsvFileSelect(file: File) {
    setCsvFile(file)
    setCsvLoading(true)
    setCsvError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/onboarding/csv-headers', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCsvError(data.error ?? 'Failed to read CSV'); return }

      const hdrs: string[] = data.headers ?? []
      setCsvHeaders(hdrs)
      setCsvSample(data.sample ?? null)
      setCsvRowCount(data.row_count ?? 0)

      const guess = (keywords: string[]) =>
        hdrs.find((h) => keywords.some((k) => h.toLowerCase().includes(k))) ?? ''
      setMapItemName(guess(['item', 'name', 'product', 'description', 'desc']))
      setMapUnitCost(guess(['cost', 'price', 'unit cost', 'unit_cost', 'rate']))
      setMapQty(guess(['qty', 'quantity', 'on hand', 'stock', 'count', 'balance']))
      setMapUnitType(guess(['unit', 'uom', 'type']))

      setStep('map-csv')
    } catch {
      setCsvError('Failed to read CSV.')
    } finally {
      setCsvLoading(false)
    }
  }

  // ── CSV map → extract ────────────────────────────────────────────────────────

  async function handleCsvMap() {
    if (!csvFile || !mapItemName) return
    setCsvLoading(true)
    setCsvError(null)
    try {
      const mapping: Record<string, string> = { item_name: mapItemName }
      if (mapUnitCost) mapping.unit_cost = mapUnitCost
      if (mapQty)      mapping.quantity  = mapQty
      if (mapUnitType) mapping.unit_type = mapUnitType

      const fd = new FormData()
      fd.append('file', csvFile)
      fd.append('mapping', JSON.stringify(mapping))
      const res  = await fetch('/api/onboarding/csv-prices', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCsvError(data.error ?? 'Failed to process CSV'); return }

      setRows((data.items ?? []).map((item: ExtractedItem) => toReviewRow(item, scanType)))
      setStep('review')
    } catch {
      setCsvError('Network error. Please try again.')
    } finally {
      setCsvLoading(false)
    }
  }

  // ── Apply ────────────────────────────────────────────────────────────────────

  async function handleApply() {
    const active = rows.filter((r) => !r.skip)
    if (active.length === 0) return
    setApplying(true)
    try {
      const entries = active.map((r) => ({
        raw_item_name:     r.raw_item_name,
        unit_cost:         r.edited_cost !== '' ? parseFloat(r.edited_cost) : null,
        units_per_package: r.units_per_package,
        quantity_on_hand:  r.edited_qty !== '' ? parseFloat(r.edited_qty) : null,
        unit_type:         r.edited_unit || r.unit_type,
        item_type:         r.edited_type,
        is_new:            r.is_new,
      }))
      const res  = await fetch('/api/onboarding/apply-prices', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries, scan_type: scanType }),
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeCount = rows.filter((r) => !r.skip).length
  const newCount    = rows.filter((r) => !r.skip && r.is_new).length

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Initial Setup</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Import inventory items, set opening stock, and apply prices from old invoices — without creating purchase records or affecting your P&amp;L.
        </p>
      </div>

      {/* ── Choose ──────────────────────────────────────────────────────────── */}
      {step === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleChoose('scan')}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl p-6 text-left transition-all"
          >
            <div className="text-2xl mb-3">📷</div>
            <p className="font-semibold text-gray-100 mb-1">Scan an Invoice</p>
            <p className="text-sm text-gray-500">
              Photo or PDF — AI reads item names, quantities, and prices automatically.
            </p>
          </button>
          <button
            onClick={() => handleChoose('csv')}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl p-6 text-left transition-all"
          >
            <div className="text-2xl mb-3">📋</div>
            <p className="font-semibold text-gray-100 mb-1">Upload a Spreadsheet</p>
            <p className="text-sm text-gray-500">
              CSV with item names, quantities, and/or prices. You choose which column is which.
            </p>
          </button>
        </div>
      )}

      {/* ── Scan upload ─────────────────────────────────────────────────────── */}
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
            {scanning ? 'Reading invoice…' : 'Extract Items & Prices'}
          </button>
        </div>
      )}

      {/* ── CSV upload ──────────────────────────────────────────────────────── */}
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

      {/* ── CSV map columns ─────────────────────────────────────────────────── */}
      {step === 'map-csv' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
            <h2 className="font-semibold text-gray-100">Map Columns</h2>
          </div>

          <p className="text-sm text-gray-400">
            Map your CSV columns. At least <strong className="text-gray-200">Item Name</strong> is required.
            {csvFile && <span className="text-gray-600 ml-1">({csvRowCount} rows in {csvFile.name})</span>}
          </p>

          {/* Sample preview */}
          {csvSample && csvHeaders.length > 0 && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto">
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Sample row</p>
              <table className="text-xs w-full">
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
            {[
              { label: 'Item Name', required: true,  value: mapItemName, set: setMapItemName },
              { label: 'Price',     required: false, value: mapUnitCost, set: setMapUnitCost },
              { label: 'Qty on Hand', required: false, value: mapQty, set: setMapQty },
              { label: 'Unit Type', required: false, value: mapUnitType, set: setMapUnitType },
            ].map(({ label, required, value, set }) => (
              <div key={label}>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {label} {required ? <span className="text-red-400">*</span> : <span className="text-gray-600">(optional)</span>}
                </label>
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">{required ? '— select —' : '— skip —'}</option>
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Scan type for defaults on new items */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Inventory type (used when creating new items)</label>
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

          {csvError && <p className="text-sm text-red-400">{csvError}</p>}

          <button
            onClick={handleCsvMap}
            disabled={!mapItemName || csvLoading}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm transition-colors"
          >
            {csvLoading ? 'Processing…' : 'Preview Items'}
          </button>
        </div>
      )}

      {/* ── Review ──────────────────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button onClick={resetAll} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
              <div>
                <h2 className="font-semibold text-gray-100">Review Items</h2>
                {vendorName && <p className="text-xs text-gray-500 mt-0.5">From: {vendorName}</p>}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <span>{activeCount} of {rows.length} selected</span>
              {newCount > 0 && <span className="ml-2 text-amber-400">{newCount} new item{newCount !== 1 ? 's' : ''} will be created</span>}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-400">
              <strong>No P&amp;L impact.</strong> This only adds items to your inventory list, sets opening stock counts, and stores prices. No purchase records are created.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No items found in this document.</p>
              <button onClick={resetAll} className="mt-3 text-amber-500 text-sm hover:text-amber-400">Try another file</button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Column headers */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_90px_80px_90px_60px_32px] gap-2 px-4 py-2.5 bg-gray-950 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <span>Item</span>
                <span>Qty on Hand</span>
                <span>Unit</span>
                <span>Price</span>
                <span>Type</span>
                <span></span>
              </div>

              <div className="divide-y divide-gray-800/60">
                {rows.map((row, i) => (
                  <div
                    key={row.id}
                    className={`px-4 py-3 transition-opacity ${row.skip ? 'opacity-35' : ''}`}
                  >
                    {/* Mobile: stacked */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {row.confidence && confidenceDot(row.confidence)}
                          <span className="text-sm text-gray-200 truncate font-medium">{row.raw_item_name}</span>
                          {row.is_new && <span className="shrink-0 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 font-semibold">NEW</span>}
                        </div>
                        <button
                          onClick={() => updateRow(i, { skip: !row.skip })}
                          className={`w-7 h-7 rounded flex items-center justify-center text-xs shrink-0 transition-colors ${
                            row.skip ? 'bg-gray-800 text-gray-600' : 'bg-gray-800 text-gray-400 hover:text-red-400'
                          }`}
                        >{row.skip ? '+' : '×'}</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-600 mb-0.5">Qty on Hand</p>
                          <input type="number" min="0" step="any" placeholder="0"
                            value={row.edited_qty} disabled={row.skip}
                            onChange={(e) => updateRow(i, { edited_qty: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 mb-0.5">Price ($)</p>
                          <input type="number" min="0" step="0.01" placeholder="—"
                            value={row.edited_cost} disabled={row.skip}
                            onChange={(e) => updateRow(i, { edited_cost: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 mb-0.5">Unit</p>
                          <input type="text" placeholder="bottle"
                            value={row.edited_unit} disabled={row.skip}
                            onChange={(e) => updateRow(i, { edited_unit: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                          />
                        </div>
                      </div>
                      {row.is_new && (
                        <div>
                          <p className="text-[10px] text-gray-600 mb-0.5">Type</p>
                          <select
                            value={row.edited_type} disabled={row.skip}
                            onChange={(e) => updateRow(i, { edited_type: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                          >
                            <option value="beverage">Beverage</option>
                            <option value="food">Food</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Desktop: grid */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_90px_80px_90px_60px_32px] gap-2 items-center">
                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {row.confidence && confidenceDot(row.confidence)}
                        <span className="text-sm text-gray-200 truncate">{row.raw_item_name}</span>
                        {row.is_new && <span className="shrink-0 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 font-semibold">NEW</span>}
                      </div>

                      {/* Qty on hand */}
                      <input type="number" min="0" step="any" placeholder="0"
                        value={row.edited_qty} disabled={row.skip}
                        onChange={(e) => updateRow(i, { edited_qty: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                      />

                      {/* Unit */}
                      <input type="text" placeholder="bottle"
                        value={row.edited_unit} disabled={row.skip}
                        onChange={(e) => updateRow(i, { edited_unit: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                      />

                      {/* Price */}
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm mr-1">$</span>
                        <input type="number" min="0" step="0.01" placeholder="—"
                          value={row.edited_cost} disabled={row.skip}
                          onChange={(e) => updateRow(i, { edited_cost: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                        />
                      </div>

                      {/* Type */}
                      {row.is_new ? (
                        <select
                          value={row.edited_type} disabled={row.skip}
                          onChange={(e) => updateRow(i, { edited_type: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-gray-100 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                        >
                          <option value="beverage">Bev</option>
                          <option value="food">Food</option>
                        </select>
                      ) : (
                        <span className="text-xs text-gray-600">existing</span>
                      )}

                      {/* Skip */}
                      <button
                        onClick={() => updateRow(i, { skip: !row.skip })}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-colors ${
                          row.skip ? 'bg-gray-800 text-gray-600 hover:text-gray-400' : 'bg-gray-800 text-gray-400 hover:text-red-400'
                        }`}
                        title={row.skip ? 'Include' : 'Skip'}
                      >{row.skip ? '+' : '×'}</button>
                    </div>
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
                disabled={applying || activeCount === 0}
                className="px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm transition-colors"
              >
                {applying
                  ? 'Saving…'
                  : `Apply ${activeCount} Item${activeCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Done ────────────────────────────────────────────────────────────── */}
      {step === 'done' && applyResult && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <span className="text-emerald-400 text-xl">✓</span>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-100">Setup complete</p>
            <p className="text-sm text-gray-500 mt-1">No purchase records created — P&amp;L is untouched.</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 pt-1">
            {[
              { label: 'Items created', value: applyResult.created },
              { label: 'Prices set',    value: applyResult.updated },
              { label: 'Stock updated', value: applyResult.stock_set },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-amber-400">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Failed items */}
          {applyResult.failed.length > 0 && (
            <div className="text-left bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {applyResult.failed.length} item{applyResult.failed.length !== 1 ? 's' : ''} failed
              </p>
              <ul className="space-y-0.5 mt-2">
                {applyResult.failed.map((name) => (
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
