'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ExpenseReceipt } from '@/types'

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExpenseHistoryPage() {
  const [receipts, setReceipts] = useState<ExpenseReceipt[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to', dateTo)
      const res  = await fetch(`/api/expense-receipts?${params}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setReceipts(data.receipts ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError('Failed to load expense history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense receipt? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/expense-receipts/${id}`, { method: 'DELETE' })
    setReceipts((prev) => prev.filter((r) => r.id !== id))
    setDeleting(null)
  }

  const totalSpend = receipts.reduce((s, r) => s + Number(r.total_amount), 0)

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Expense History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Confirmed non-inventory operating expenses</p>
        </div>
        <Link
          href="/expenses"
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-colors"
        >
          + Scan Receipt
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={load}
          className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
        >
          Filter
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(load, 0) }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-slate-500">
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} · Total <span className="text-blue-400 font-medium">${totalSpend.toFixed(2)}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">No expense receipts yet.</p>
          <Link href="/expenses" className="text-blue-400 text-xs mt-1 block hover:underline">
            Upload your first receipt →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-slate-500 uppercase tracking-widest font-semibold">
            <span>Vendor</span>
            <span>Date</span>
            <span className="text-right">Subtotal</span>
            <span className="text-right">Total</span>
            <span></span>
          </div>
          <div className="divide-y divide-gray-800">
            {receipts.map((r) => (
              <div key={r.id} className="flex sm:grid sm:grid-cols-[1fr_120px_100px_100px_80px] items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{r.vendor_name ?? '—'}</p>
                  {r.notes && <p className="text-xs text-slate-500 truncate mt-0.5">{r.notes}</p>}
                  <p className="text-xs text-slate-600 sm:hidden mt-0.5">{fmt(r.receipt_date)}</p>
                </div>
                <span className="hidden sm:block text-sm text-slate-400">{fmt(r.receipt_date)}</span>
                <span className="hidden sm:block text-sm text-slate-500 text-right">
                  {r.subtotal != null ? `$${Number(r.subtotal).toFixed(2)}` : '—'}
                </span>
                <span className="text-sm font-semibold text-blue-400 text-right sm:text-right">
                  ${Number(r.total_amount).toFixed(2)}
                </span>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <Link
                    href={`/expenses/receipt/${r.id}`}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === r.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
