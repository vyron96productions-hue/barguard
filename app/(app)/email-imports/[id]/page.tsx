'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface DraftRow {
  id: string
  sort_order: number
  sale_date: string
  raw_item_name: string
  quantity_sold: number
  gross_sales: number | null
  check_id: string | null
  station: string | null
  menu_item_id: string | null
  validation_error: string | null
  is_duplicate_warning: boolean
}

interface Draft {
  id: string
  filename: string
  status: string
  row_count: number
  valid_row_count: number
  invalid_row_count: number
  has_duplicate_warning: boolean
  expires_at: string
  created_at: string
  email_ingest_messages: {
    sender_email: string
    subject: string | null
    received_at: string | null
  } | null
  sales_import_draft_rows: DraftRow[]
}

interface ImportResult {
  upload_id: string
  rows_imported: number
  matched: number
  auto_linked: number
  unresolved_aliases: string[]
}

export default function EmailImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params)
  const router    = useRouter()

  const [draft, setDraft]           = useState<Draft | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [result, setResult]         = useState<ImportResult | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetch(`/api/email-imports/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setDraft(data)
      })
      .catch(() => setError('Failed to load draft'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirm() {
    if (!draft || confirming) return
    setConfirming(true)
    setActionError('')
    try {
      const res  = await fetch(`/api/email-imports/${id}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Confirm failed')
      setResult(data)
      setDraft((d) => d ? { ...d, status: 'imported' } : d)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Confirm failed')
    } finally {
      setConfirming(false)
    }
  }

  async function handleCancel() {
    if (!draft || cancelling) return
    setCancelling(true)
    setActionError('')
    try {
      const res  = await fetch(`/api/email-imports/${id}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Cancel failed')
      router.push('/email-imports')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Cancel failed')
      setCancelling(false)
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm max-w-xl">
        {error}
      </div>
    )
  }

  if (!draft) return null

  const msg        = draft.email_ingest_messages
  const isPending  = draft.status === 'pending_review'
  const validRows  = draft.sales_import_draft_rows.filter((r) => !r.validation_error)
  const invalidRows = draft.sales_import_draft_rows.filter((r) => r.validation_error)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/email-imports')}
            className="text-xs text-slate-500 hover:text-slate-300 mb-2 transition-colors"
          >
            ← Back to Email Imports
          </button>
          <h1 className="text-xl font-bold text-gray-100 truncate">{draft.filename}</h1>
          {msg && (
            <p className="text-xs text-slate-500 mt-1">
              From: {msg.sender_email}
              {msg.received_at && ` · ${new Date(msg.received_at).toLocaleDateString()}`}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded border ${
          isPending
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : 'bg-slate-700/40 text-slate-500 border-slate-700'
        }`}>
          {draft.status.replace('_', ' ')}
        </span>
      </div>

      {/* Import result banner */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-4 space-y-1">
          <p className="text-emerald-400 text-sm font-semibold">Import complete</p>
          <p className="text-emerald-400/80 text-xs">
            {result.rows_imported} rows imported · {result.matched} matched · {result.auto_linked} auto-linked
          </p>
          {result.unresolved_aliases.length > 0 && (
            <p className="text-amber-400 text-xs mt-1">
              {result.unresolved_aliases.length} item{result.unresolved_aliases.length !== 1 ? 's' : ''} unmatched —{' '}
              <a href="/sales" className="underline">resolve in Sales Log</a>
            </p>
          )}
        </div>
      )}

      {/* Warnings */}
      {draft.has_duplicate_warning && isPending && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-300 text-sm">
          This file appears to be a duplicate of a previous import. Review carefully before confirming.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Rows', value: draft.row_count },
          { label: 'Valid',      value: draft.valid_row_count,   color: 'text-emerald-400' },
          { label: 'Invalid',    value: draft.invalid_row_count, color: draft.invalid_row_count > 0 ? 'text-amber-400' : undefined },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className={`text-xl font-bold ${s.color ?? 'text-slate-100'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isPending && !result && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming || cancelling || draft.valid_row_count === 0}
            className="px-5 py-2.5 bg-amber-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            {confirming ? 'Importing…' : `Import ${draft.valid_row_count} Row${draft.valid_row_count !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={handleCancel}
            disabled={confirming || cancelling}
            className="px-5 py-2.5 border border-slate-700 text-slate-400 font-medium rounded-lg text-sm hover:text-slate-200 hover:border-slate-600 disabled:opacity-40 transition-colors"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Import'}
          </button>
          {actionError && (
            <p className="text-xs text-red-400">{actionError}</p>
          )}
        </div>
      )}

      {/* Valid rows preview */}
      {validRows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-slate-200">Valid Rows ({validRows.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-slate-500">
                  <th className="px-4 py-2.5 text-left font-medium">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium">Item</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sales</th>
                  <th className="px-4 py-2.5 text-left font-medium">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {validRows.slice(0, 100).map((row) => (
                  <tr key={row.id} className={row.is_duplicate_warning ? 'bg-amber-500/5' : ''}>
                    <td className="px-4 py-2 text-slate-400">{row.sale_date}</td>
                    <td className="px-4 py-2 text-slate-200 max-w-xs truncate">
                      {row.raw_item_name}
                      {row.menu_item_id && <span className="ml-1 text-emerald-500/60">✓</span>}
                    </td>
                    <td className="px-4 py-2 text-slate-300 text-right">{row.quantity_sold}</td>
                    <td className="px-4 py-2 text-slate-300 text-right">
                      {row.gross_sales !== null ? `$${Number(row.gross_sales).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{row.check_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validRows.length > 100 && (
              <p className="px-4 py-3 text-xs text-slate-600">
                Showing 100 of {validRows.length} rows.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invalid rows */}
      {invalidRows.length > 0 && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-500/20">
            <p className="text-sm font-semibold text-amber-300">Skipped Rows ({invalidRows.length})</p>
            <p className="text-xs text-slate-500 mt-0.5">These rows had validation errors and will not be imported.</p>
          </div>
          <div className="divide-y divide-gray-800/60">
            {invalidRows.slice(0, 20).map((row) => (
              <div key={row.id} className="px-4 py-2.5 text-xs">
                <span className="text-slate-400">{row.raw_item_name}</span>
                <span className="text-amber-500/80 ml-2">{row.validation_error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
