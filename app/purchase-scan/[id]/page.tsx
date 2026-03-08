'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import type { PurchaseImportDraftWithLines, PurchaseImportDraftLine, InventoryItem } from '@/types'

const UNIT_OPTIONS = ['oz', 'ml', 'l', 'bottle', 'case', 'keg', 'halfkeg', 'quarterkeg', 'sixthkeg', 'pint']

interface EditableLine {
  id: string
  raw_item_name: string
  inventory_item_id: string | null
  quantity: string
  unit_type: string
  unit_cost: string
  match_status: 'matched' | 'unmatched' | 'manual'
  confidence: 'high' | 'medium' | 'low'
  is_approved: boolean
  save_alias: boolean
}

function toEditableLine(line: PurchaseImportDraftLine): EditableLine {
  return {
    id: line.id,
    raw_item_name: line.raw_item_name,
    inventory_item_id: line.inventory_item_id,
    quantity: line.quantity?.toString() ?? '',
    unit_type: line.unit_type ?? '',
    unit_cost: line.unit_cost?.toString() ?? '',
    match_status: line.match_status,
    confidence: line.confidence,
    is_approved: line.is_approved,
    save_alias: false,
  }
}

export default function PurchaseScanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [draft, setDraft] = useState<PurchaseImportDraftWithLines | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendorName, setVendorName] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [lines, setLines] = useState<EditableLine[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRawText, setShowRawText] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [draftRes, itemsRes] = await Promise.all([
          fetch(`/api/purchase-import-drafts/${id}`),
          fetch('/api/inventory-items'),
        ])
        if (!draftRes.ok) { setError('Draft not found'); return }
        const draftData: PurchaseImportDraftWithLines = await draftRes.json()
        const itemsData: InventoryItem[] = await itemsRes.json()
        setDraft(draftData)
        setVendorName(draftData.vendor_name ?? '')
        setPurchaseDate(draftData.purchase_date ?? '')
        setLines(draftData.lines.map(toEditableLine))
        setInventoryItems(itemsData)
      } catch {
        setError('Failed to load draft')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function updateLine(index: number, patch: Partial<EditableLine>) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l
        const updated = { ...l, ...patch }
        if ('inventory_item_id' in patch) {
          updated.match_status = patch.inventory_item_id ? 'manual' : 'unmatched'
        }
        return updated
      })
    )
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        raw_item_name: '',
        inventory_item_id: null,
        quantity: '',
        unit_type: '',
        unit_cost: '',
        match_status: 'unmatched',
        confidence: 'high',
        is_approved: true,
        save_alias: false,
      },
    ])
  }

  async function handleConfirm() {
    const approvedCount = lines.filter((l) => l.is_approved).length
    if (approvedCount === 0) {
      setSubmitError('Approve at least one line item before confirming.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/purchase-import-drafts/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: vendorName || null,
          purchase_date: purchaseDate || null,
          lines: lines.map((l) => ({
            id: l.id,
            raw_item_name: l.raw_item_name,
            inventory_item_id: l.inventory_item_id,
            quantity: parseFloat(l.quantity) || null,
            unit_type: l.unit_type || null,
            unit_cost: parseFloat(l.unit_cost) || null,
            is_approved: l.is_approved,
            save_alias: l.save_alias,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? 'Confirmation failed'); return }
      router.push(`/purchase-scan?confirmed=${data.rows_imported}`)
    } catch {
      setSubmitError('Failed to confirm. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading draft…</p>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <p className="text-red-400">{error ?? 'Draft not found'}</p>
        </div>
      </div>
    )
  }

  if (draft.status === 'confirmed') {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Purchase Scan Review</h1>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
          <p className="text-emerald-400 font-medium">This import has already been confirmed.</p>
          <p className="text-slate-400 text-sm mt-1">Purchase records have been saved.</p>
          <a href="/uploads" className="inline-block mt-4 text-sm text-amber-400 hover:underline">
            View Import Reports →
          </a>
        </div>
      </div>
    )
  }

  const unmatchedCount = lines.filter((l) => l.is_approved && l.match_status === 'unmatched').length
  const lowConfidenceCount = lines.filter((l) => l.confidence === 'low').length
  const approvedCount = lines.filter((l) => l.is_approved).length

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Review Purchase Import</h1>
          <p className="text-gray-500 mt-1 text-sm truncate max-w-xs sm:max-w-none">
            {draft.document_upload?.filename ?? 'Scanned document'}
          </p>
        </div>
        <a href="/purchase-scan" className="text-xs text-slate-500 hover:text-slate-300 mt-1 shrink-0">
          ← Back
        </a>
      </div>

      {/* Low confidence warning */}
      {(draft.confidence === 'low' || draft.warning_message) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <span className="text-amber-400 text-lg shrink-0">⚠</span>
          <div>
            <p className="text-amber-400 text-sm font-medium">Low extraction confidence</p>
            {draft.warning_message && (
              <p className="text-amber-300/70 text-xs mt-0.5">{draft.warning_message}</p>
            )}
            <p className="text-amber-300/70 text-xs mt-0.5">Review all fields carefully before confirming.</p>
          </div>
        </div>
      )}

      {/* Document preview */}
      <DocumentPreview draft={draft} showRawText={showRawText} setShowRawText={setShowRawText} />

      {/* Header fields */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Document Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Vendor / Supplier</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Southern Glazer's"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>
      </div>

      {/* Match status summary */}
      {(unmatchedCount > 0 || lowConfidenceCount > 0) && (
        <div className="flex gap-2 flex-wrap">
          {unmatchedCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-xs text-red-400">{unmatchedCount} unmatched — link to inventory below</span>
            </div>
          )}
          {lowConfidenceCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-xs text-amber-400">{lowConfidenceCount} low-confidence line{lowConfidenceCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Line Items</h2>
          <span className="text-xs text-slate-500">{approvedCount} approved</span>
        </div>

        {/* Mobile: card-per-line layout */}
        <div className="lg:hidden divide-y divide-gray-800/70">
          {lines.map((line, idx) => (
            <MobileLineCard
              key={line.id}
              line={line}
              inventoryItems={inventoryItems}
              onChange={(patch) => updateLine(idx, patch)}
              onRemove={() => removeLine(idx)}
            />
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium w-6">✓</th>
                <th className="text-left px-4 py-2.5 font-medium min-w-[160px]">Item Name (from doc)</th>
                <th className="text-left px-4 py-2.5 font-medium min-w-[160px]">Inventory Item</th>
                <th className="text-left px-4 py-2.5 font-medium w-20">Qty</th>
                <th className="text-left px-4 py-2.5 font-medium w-24">Unit</th>
                <th className="text-left px-4 py-2.5 font-medium w-24">Unit Cost</th>
                <th className="text-left px-4 py-2.5 font-medium w-20">Status</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70">
              {lines.map((line, idx) => (
                <DesktopLineRow
                  key={line.id}
                  line={line}
                  inventoryItems={inventoryItems}
                  onChange={(patch) => updateLine(idx, patch)}
                  onRemove={() => removeLine(idx)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-gray-800">
          <button onClick={addLine} className="text-xs text-slate-500 hover:text-amber-400 transition-colors py-1">
            + Add line
          </button>
        </div>
      </div>

      {/* Submit */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Saving…' : `Confirm & Save ${approvedCount} Record${approvedCount !== 1 ? 's' : ''}`}
        </button>
        <a
          href="/purchase-scan"
          className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors shrink-0"
        >
          Cancel
        </a>
      </div>
    </div>
  )
}

// ── Document preview ──────────────────────────────────────────────────────────

function DocumentPreview({ draft, showRawText, setShowRawText }: {
  draft: PurchaseImportDraftWithLines
  showRawText: boolean
  setShowRawText: (v: boolean) => void
}) {
  const doc = draft.document_upload
  if (!doc) return null
  const isImage = doc.file_type.startsWith('image/')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Source Document</span>
        {doc.raw_extracted_text && (
          <button onClick={() => setShowRawText(!showRawText)} className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
            {showRawText ? 'Hide' : 'Show'} raw text
          </button>
        )}
      </div>

      {isImage && doc.file_data && (
        <div className="p-3 sm:p-4 flex justify-center bg-slate-950/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${doc.file_type};base64,${doc.file_data}`}
            alt="Uploaded receipt"
            className="max-h-64 sm:max-h-72 object-contain rounded border border-slate-800"
          />
        </div>
      )}

      {!isImage && (
        <div className="px-4 sm:px-5 py-4 flex items-center gap-3 text-slate-400">
          <span className="text-2xl">📄</span>
          <div>
            <p className="text-sm text-slate-300">{doc.filename}</p>
            <p className="text-xs text-slate-600">PDF — text extracted below</p>
          </div>
        </div>
      )}

      {showRawText && doc.raw_extracted_text && (
        <div className="border-t border-gray-800 px-4 sm:px-5 py-4">
          <p className="text-xs text-slate-500 mb-2">Extracted text</p>
          <pre className="text-xs text-slate-400 bg-slate-950/50 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap">
            {doc.raw_extracted_text}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Match badge ───────────────────────────────────────────────────────────────

function MatchBadge({ status, confidence }: { status: EditableLine['match_status']; confidence: EditableLine['confidence'] }) {
  if (confidence === 'low') return <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">low conf</span>
  if (status === 'matched') return <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">matched</span>
  if (status === 'manual') return <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">manual</span>
  return <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">unmatched</span>
}

// ── Mobile card per line ──────────────────────────────────────────────────────

function MobileLineCard({ line, inventoryItems, onChange, onRemove }: {
  line: EditableLine
  inventoryItems: InventoryItem[]
  onChange: (patch: Partial<EditableLine>) => void
  onRemove: () => void
}) {
  const isLowConf = line.confidence === 'low'
  return (
    <div className={`p-4 space-y-3 ${isLowConf ? 'bg-amber-500/5' : ''} ${!line.is_approved ? 'opacity-40' : ''}`}>
      {/* Row 1: checkbox + badge + remove */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={line.is_approved}
            onChange={(e) => onChange({ is_approved: e.target.checked })}
            className="accent-amber-500 w-4 h-4 shrink-0" />
          <MatchBadge status={line.match_status} confidence={line.confidence} />
        </div>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none p-1" title="Remove">×</button>
      </div>

      {/* Row 2: raw item name */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Item name (from doc)</label>
        <input
          type="text"
          value={line.raw_item_name}
          onChange={(e) => onChange({ raw_item_name: e.target.value })}
          className="mt-1 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
        />
      </div>

      {/* Row 3: inventory item */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Inventory Item</label>
        <select
          value={line.inventory_item_id ?? ''}
          onChange={(e) => onChange({ inventory_item_id: e.target.value || null })}
          className="mt-1 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
        >
          <option value="">— unmatched —</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
          ))}
        </select>
        {line.inventory_item_id && line.match_status === 'manual' && (
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input type="checkbox" checked={line.save_alias}
              onChange={(e) => onChange({ save_alias: e.target.checked })}
              className="accent-amber-500 w-3.5 h-3.5" />
            <span className="text-[11px] text-slate-500">Save alias for future imports</span>
          </label>
        )}
        {line.match_status === 'unmatched' && line.is_approved && (
          <p className="text-red-400 text-[10px] mt-1">Not linked to inventory — purchases may not calculate correctly</p>
        )}
      </div>

      {/* Row 4: qty / unit / cost */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Qty</label>
          <input type="number" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })}
            placeholder="0"
            className="mt-1 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Unit</label>
          <select value={line.unit_type} onChange={(e) => onChange({ unit_type: e.target.value })}
            className="mt-1 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60">
            <option value="">—</option>
            {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Cost ($)</label>
          <input type="number" step="0.01" value={line.unit_cost} onChange={(e) => onChange({ unit_cost: e.target.value })}
            placeholder="0.00"
            className="mt-1 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60" />
        </div>
      </div>
    </div>
  )
}

// ── Desktop table row ─────────────────────────────────────────────────────────

function DesktopLineRow({ line, inventoryItems, onChange, onRemove }: {
  line: EditableLine
  inventoryItems: InventoryItem[]
  onChange: (patch: Partial<EditableLine>) => void
  onRemove: () => void
}) {
  const isLowConf = line.confidence === 'low'
  return (
    <tr className={`${isLowConf ? 'bg-amber-500/5' : ''} ${!line.is_approved ? 'opacity-40' : ''}`}>
      <td className="px-4 py-2">
        <input type="checkbox" checked={line.is_approved}
          onChange={(e) => onChange({ is_approved: e.target.checked })}
          className="accent-amber-500" />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={line.raw_item_name}
          onChange={(e) => onChange({ raw_item_name: e.target.value })}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500/60" />
      </td>
      <td className="px-2 py-2">
        <div className="space-y-1">
          <select value={line.inventory_item_id ?? ''} onChange={(e) => onChange({ inventory_item_id: e.target.value || null })}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60">
            <option value="">— unmatched —</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
            ))}
          </select>
          {line.inventory_item_id && line.match_status === 'manual' && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={line.save_alias}
                onChange={(e) => onChange({ save_alias: e.target.checked })}
                className="accent-amber-500 w-3 h-3" />
              <span className="text-[10px] text-slate-500">Save alias</span>
            </label>
          )}
        </div>
      </td>
      <td className="px-2 py-2">
        <input type="number" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })}
          placeholder="0"
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60" />
      </td>
      <td className="px-2 py-2">
        <select value={line.unit_type} onChange={(e) => onChange({ unit_type: e.target.value })}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60">
          <option value="">—</option>
          {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded overflow-hidden">
          <span className="px-1.5 text-slate-500">$</span>
          <input type="number" step="0.01" value={line.unit_cost} onChange={(e) => onChange({ unit_cost: e.target.value })}
            placeholder="0.00"
            className="flex-1 bg-transparent py-1 pr-2 text-xs text-slate-200 focus:outline-none" />
        </div>
      </td>
      <td className="px-2 py-2">
        <MatchBadge status={line.match_status} confidence={line.confidence} />
      </td>
      <td className="px-2 py-2 text-center">
        <button onClick={onRemove} className="text-slate-700 hover:text-red-400 transition-colors text-sm leading-none" title="Remove">×</button>
      </td>
    </tr>
  )
}
