'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseImportDraftWithLines, ExpenseImportDraftLine, ExpenseCategory } from '@/types'

interface EditableLine {
  id: string
  raw_item_name: string
  quantity: string
  unit_price: string
  line_total: string
  expense_category_id: string
  notes: string
  confidence: 'high' | 'medium' | 'low'
}

function toEditableLine(line: ExpenseImportDraftLine): EditableLine {
  return {
    id:                  line.id,
    raw_item_name:       line.raw_item_name,
    quantity:            line.quantity?.toString() ?? '',
    unit_price:          line.unit_price?.toString() ?? '',
    line_total:          line.line_total?.toString() ?? '',
    expense_category_id: line.expense_category_id ?? '',
    notes:               line.notes ?? '',
    confidence:          line.confidence,
  }
}

export default function ExpenseDraftReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [draft, setDraft]             = useState<ExpenseImportDraftWithLines | null>(null)
  const [categories, setCategories]   = useState<ExpenseCategory[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRawText, setShowRawText] = useState(false)

  // Header fields
  const [vendorName, setVendorName]     = useState('')
  const [receiptDate, setReceiptDate]   = useState('')
  const [subtotal, setSubtotal]         = useState('')
  const [taxAmount, setTaxAmount]       = useState('')
  const [totalAmount, setTotalAmount]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [receiptNotes, setReceiptNotes] = useState('')
  const [bulkCategoryId, setBulkCategoryId] = useState('')

  const [lines, setLines] = useState<EditableLine[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [draftRes, catsRes] = await Promise.all([
          fetch(`/api/expense-import-drafts/${id}`),
          fetch('/api/expense-categories'),
        ])
        if (!draftRes.ok) { setError('Draft not found'); return }
        const draftData: ExpenseImportDraftWithLines = await draftRes.json()
        const catsData: ExpenseCategory[] = await catsRes.json()
        setDraft(draftData)
        setCategories(catsData)
        setVendorName(draftData.vendor_name ?? '')
        setReceiptDate(draftData.receipt_date ?? '')
        setSubtotal(draftData.subtotal?.toString() ?? '')
        setTaxAmount(draftData.tax_amount?.toString() ?? '')
        setTotalAmount(draftData.total_amount?.toString() ?? '')
        setPaymentMethod(draftData.payment_method ?? '')
        setLines(draftData.lines.map(toEditableLine))
      } catch {
        setError('Failed to load draft')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function updateLine(idx: number, field: keyof EditableLine, value: string) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, raw_item_name: '', quantity: '', unit_price: '', line_total: '', expense_category_id: '', notes: '', confidence: 'medium' },
    ])
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  function applyBulkCategory() {
    if (!bulkCategoryId) return
    setLines((prev) => prev.map((l) => ({ ...l, expense_category_id: bulkCategoryId })))
  }

  async function handleConfirm() {
    const total = parseFloat(totalAmount)
    if (!total || total <= 0) {
      setSubmitError('Total amount is required')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const body = {
        vendor_name:    vendorName || null,
        receipt_date:   receiptDate || null,
        subtotal:       subtotal    ? parseFloat(subtotal)   : null,
        tax_amount:     taxAmount   ? parseFloat(taxAmount)  : null,
        total_amount:   total,
        payment_method: paymentMethod || null,
        notes:          receiptNotes || null,
        lines: lines
          .filter((l) => l.raw_item_name.trim())
          .map((l) => ({
            id:                  l.id,
            raw_item_name:       l.raw_item_name,
            quantity:            l.quantity            ? parseFloat(l.quantity)   : null,
            unit_price:          l.unit_price          ? parseFloat(l.unit_price) : null,
            line_total:          l.line_total          ? parseFloat(l.line_total) : null,
            expense_category_id: l.expense_category_id || null,
            notes:               l.notes || null,
          })),
      }
      const res = await fetch(`/api/expense-import-drafts/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? 'Confirm failed'); return }
      router.push('/expenses/history')
    } catch {
      setSubmitError('Confirm failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-slate-500 text-sm py-12 text-center">Loading draft…</div>
  }

  if (error || !draft) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 text-sm">{error ?? 'Draft not found'}</p>
      </div>
    )
  }

  const alreadyConfirmed = draft.status === 'confirmed'
  const imageData = draft.document_upload?.file_data
  const rawText   = draft.document_upload?.raw_extracted_text

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back</button>
          <h1 className="text-xl font-bold text-gray-100">Review Expense Receipt</h1>
          {draft.confidence === 'low' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Low confidence</span>
          )}
        </div>
        {draft.warning_message && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 mt-2">
            <p className="text-amber-400 text-xs">{draft.warning_message}</p>
          </div>
        )}
      </div>

      {alreadyConfirmed && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-4">
          <p className="text-emerald-400 text-sm font-medium">This draft has already been confirmed.</p>
          <button onClick={() => router.push('/expenses/history')} className="text-xs text-emerald-400 underline mt-1">View in History →</button>
        </div>
      )}

      {/* Receipt image preview */}
      {imageData && draft.document_upload?.file_type?.startsWith('image/') && (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${draft.document_upload.file_type};base64,${imageData}`}
            alt="Receipt"
            className="max-h-64 w-full object-contain"
          />
        </div>
      )}

      {/* Receipt header fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Receipt Details</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vendor / Store Name</label>
            <input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Walmart, Office Depot"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Receipt Date</label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subtotal</label>
            <input
              type="number"
              step="0.01"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tax</label>
            <input
              type="number"
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Total <span className="text-red-400">*</span></label>
            <input
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Unknown</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
              <option value="check">Check</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
          <input
            value={receiptNotes}
            onChange={(e) => setReceiptNotes(e.target.value)}
            placeholder="Any notes about this expense…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Bulk category */}
      {lines.length > 1 && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 shrink-0">Apply one category to all lines:</p>
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={applyBulkCategory}
            disabled={!bulkCategoryId}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Line items */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Line Items ({lines.length})
          </p>
          <button
            onClick={addLine}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            + Add line
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-500 text-sm">No line items extracted.</p>
            <p className="text-slate-600 text-xs mt-1">Add lines manually or save with just the total.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {lines.map((line, idx) => (
              <div key={line.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      value={line.raw_item_name}
                      onChange={(e) => updateLine(idx, 'raw_item_name', e.target.value)}
                      placeholder="Item description"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                        placeholder="Unit $"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.line_total}
                        onChange={(e) => updateLine(idx, 'line_total', e.target.value)}
                        placeholder="Total $"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={line.expense_category_id}
                        onChange={(e) => updateLine(idx, 'expense_category_id', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(idx)}
                    className="text-slate-600 hover:text-red-400 transition-colors mt-1 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
                    </svg>
                  </button>
                </div>
                {line.confidence === 'low' && (
                  <p className="text-xs text-amber-400/70">⚠ Low confidence — please review</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw OCR text toggle */}
      {rawText && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            <span className="uppercase tracking-widest font-semibold">Raw Extracted Text</span>
            <span>{showRawText ? '▲' : '▼'}</span>
          </button>
          {showRawText && (
            <pre className="px-5 pb-4 text-xs text-slate-500 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto border-t border-slate-800">
              {rawText}
            </pre>
          )}
        </div>
      )}

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      {/* Actions */}
      {!alreadyConfirmed && (
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={submitting || !totalAmount}
            className="flex-1 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving…' : 'Confirm & Save Expense'}
          </button>
          <button
            onClick={() => router.push('/expenses')}
            className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
