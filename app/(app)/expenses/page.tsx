'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ExpenseImportDraft } from '@/types'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXT   = '.jpg,.jpeg,.png,.webp,.pdf'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function ExpensesPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [dragOver, setDragOver]       = useState(false)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [drafts, setDrafts]           = useState<ExpenseImportDraft[] | null>(null)
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [activeTab, setActiveTab]     = useState<'upload' | 'drafts'>('upload')

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported file type. Please upload a JPG, PNG, or PDF.')
      return
    }
    setSelectedFile(file)
    setErrorMsg(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploadState('uploading')
    setErrorMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res  = await fetch('/api/uploads/expense-scan', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Upload failed'); setUploadState('error'); return }
      setUploadState('done')
      router.push(`/expenses/${data.draft_id}`)
    } catch {
      setErrorMsg('Upload failed. Please try again.')
      setUploadState('error')
    }
  }

  async function loadDrafts() {
    setLoadingDrafts(true)
    try {
      const res  = await fetch('/api/expense-import-drafts')
      const data = await res.json()
      setDrafts(data)
    } finally {
      setLoadingDrafts(false)
    }
  }

  function handleDraftsTabClick() {
    setActiveTab('drafts')
    if (!drafts) loadDrafts()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Expense Receipt Scanner</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium border border-blue-500/20">
            Non-Inventory
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          Scan operating expense receipts — office supplies, cleaning products, maintenance, and more.
          These are kept separate from inventory purchases.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        <Link href="/expenses/history"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors">
          <span>📋</span> History
        </Link>
        <Link href="/expenses/analytics"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors">
          <span>📊</span> Analytics
        </Link>
        <Link href="/expenses/categories"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors">
          <span>🏷</span> Categories
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            activeTab === 'upload' ? 'bg-blue-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Upload Receipt
        </button>
        <button
          onClick={handleDraftsTabClick}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            activeTab === 'drafts' ? 'bg-blue-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Pending Drafts
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-4">
          {/* Info note */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <p className="text-xs text-blue-300/80 leading-relaxed font-medium mb-1">Non-inventory expenses only</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use this for operating costs like pens, notebooks, cleaning spray, trash bags, batteries,
              printer paper, tools, and maintenance supplies. For bar stock and beverages, use{' '}
              <Link href="/purchase-scan" className="text-blue-400 hover:underline">Purchase Scan</Link>.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-500/5'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900'
            }`}
          >
            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={handleFileChange} />
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-2xl">🧾</p>
                <p className="text-sm font-medium text-emerald-400">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB · {selectedFile.type}</p>
                <p className="text-xs text-slate-500">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl text-slate-600">🧾</p>
                <p className="text-sm font-medium text-slate-300">Drop your expense receipt here</p>
                <p className="text-xs text-slate-500">or click to browse</p>
                <p className="text-xs text-slate-600 mt-2">Supported: JPG, PNG, PDF · Max 10 MB</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === 'uploading'}
            className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadState === 'uploading' ? 'Extracting data…' : 'Upload & Extract'}
          </button>
        </div>
      ) : (
        <DraftList drafts={drafts} loading={loadingDrafts} onRefresh={loadDrafts} />
      )}
    </div>
  )
}

function DraftList({
  drafts,
  loading,
  onRefresh,
}: {
  drafts: ExpenseImportDraft[] | null
  loading: boolean
  onRefresh: () => void
}) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/expense-import-drafts/${id}`, { method: 'DELETE' })
    onRefresh()
    setDeleting(null)
  }

  if (loading || drafts === null) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  const pending = drafts.filter((d) => d.status === 'pending')

  if (pending.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No pending drafts.</p>
        <p className="text-slate-600 text-xs mt-1">Upload a receipt to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
      {pending.map((draft) => (
        <div key={draft.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors group">
          <a href={`/expenses/${draft.id}`} className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {draft.vendor_name ?? draft.document_upload?.filename ?? 'Unknown vendor'}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-slate-500">
                {new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </span>
              {draft.total_amount != null && (
                <span className="text-xs text-blue-400 font-medium">${Number(draft.total_amount).toFixed(2)}</span>
              )}
            </div>
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400">pending</span>
            <button
              onClick={() => handleDelete(draft.id)}
              disabled={deleting === draft.id}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50 px-1"
            >
              {deleting === draft.id ? '…' : '✕'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
