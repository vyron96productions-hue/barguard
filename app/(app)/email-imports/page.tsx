'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DraftSummary {
  id: string
  filename: string
  status: string
  row_count: number
  valid_row_count: number
  has_duplicate_warning: boolean
  expires_at: string
  created_at: string
  confirmed_at: string | null
  cancelled_at: string | null
  email_ingest_messages: {
    sender_email: string
    subject: string | null
    received_at: string | null
  } | null
}

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review',
  imported:       'Imported',
  cancelled:      'Cancelled',
  expired:        'Expired',
}

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  imported:       'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled:      'bg-slate-700/40 text-slate-500 border-slate-700',
  expired:        'bg-slate-700/40 text-slate-500 border-slate-700',
}

export default function EmailImportsPage() {
  const [drafts, setDrafts]   = useState<DraftSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/email-imports')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDrafts(data)
        else setError(data.error ?? 'Failed to load imports')
      })
      .catch(() => setError('Failed to load imports'))
      .finally(() => setLoading(false))
  }, [])

  const pending = drafts.filter((d) => d.status === 'pending_review')
  const history = drafts.filter((d) => d.status !== 'pending_review')

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Email Sales Imports</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Sales CSVs received via email are staged here for review before import.
        </p>
      </div>

      {loading && (
        <p className="text-slate-500 text-sm">Loading…</p>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pending */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Pending Review {pending.length > 0 && `(${pending.length})`}
            </h2>

            {pending.length === 0 ? (
              <p className="text-slate-600 text-sm">No imports pending review.</p>
            ) : (
              pending.map((d) => <DraftCard key={d.id} draft={d} />)
            )}
          </section>

          {/* History */}
          {history.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">History</h2>
              {history.map((d) => <DraftCard key={d.id} draft={d} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function DraftCard({ draft }: { draft: DraftSummary }) {
  const msg        = draft.email_ingest_messages
  const statusClass = STATUS_COLORS[draft.status] ?? STATUS_COLORS.expired
  const statusLabel = STATUS_LABEL[draft.status]  ?? draft.status
  const isPending   = draft.status === 'pending_review'

  const receivedAt = msg?.received_at ? new Date(msg.received_at).toLocaleDateString() : null
  const expiresAt  = isPending ? new Date(draft.expires_at).toLocaleDateString() : null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{draft.filename}</p>
          {msg && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              From: {msg.sender_email}{receivedAt ? ` · ${receivedAt}` : ''}
            </p>
          )}
          {msg?.subject && (
            <p className="text-xs text-slate-600 mt-0.5 truncate">{msg.subject}</p>
          )}
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded border ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{draft.valid_row_count} valid row{draft.valid_row_count !== 1 ? 's' : ''}</span>
        {draft.row_count > draft.valid_row_count && (
          <span className="text-amber-500/80">
            {draft.row_count - draft.valid_row_count} invalid
          </span>
        )}
        {draft.has_duplicate_warning && (
          <span className="text-amber-500/80">Possible duplicate</span>
        )}
        {expiresAt && (
          <span>Expires {expiresAt}</span>
        )}
      </div>

      {isPending && (
        <div className="pt-1">
          <Link
            href={`/email-imports/${draft.id}`}
            className="inline-block px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors"
          >
            Review & Import
          </Link>
        </div>
      )}
    </div>
  )
}
