'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { PurchaseImportDraft } from '@/types'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp,.pdf'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function PurchaseScanPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [drafts, setDrafts] = useState<PurchaseImportDraft[] | null>(null)
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [draftTab, setDraftTab] = useState(false)

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

      const res = await fetch('/api/uploads/purchase-scan', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Upload failed')
        setUploadState('error')
        return
      }

      setUploadState('done')
      router.push(`/purchase-scan/${data.draft_id}`)
    } catch {
      setErrorMsg('Upload failed. Please try again.')
      setUploadState('error')
    }
  }

  async function loadDrafts() {
    setLoadingDrafts(true)
    try {
      const res = await fetch('/api/purchase-import-drafts')
      const data = await res.json()
      setDrafts(data)
    } finally {
      setLoadingDrafts(false)
    }
  }

  function handleDraftTabClick() {
    setDraftTab(true)
    if (!drafts) loadDrafts()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Purchase Scan Import</h1>
        <p className="text-gray-500 mt-1">
          Upload a receipt or invoice image (JPG, PNG) or PDF to automatically extract purchase data for review.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        <button
          onClick={() => setDraftTab(false)}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            !draftTab ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Upload Document
        </button>
        <button
          onClick={handleDraftTabClick}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            draftTab ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Previous Imports
        </button>
      </div>

      {!draftTab ? (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-amber-400 bg-amber-500/5'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-2xl">📄</p>
                <p className="text-sm font-medium text-emerald-400">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(0)} KB · {selectedFile.type}
                </p>
                <p className="text-xs text-slate-500">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl text-slate-600">⊡</p>
                <p className="text-sm font-medium text-slate-300">Drop your receipt or invoice here</p>
                <p className="text-xs text-slate-500">or click to browse</p>
                <p className="text-xs text-slate-600 mt-2">Supported: JPG, PNG, PDF</p>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-lg p-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              BarGuard uses AI to read your document and extract vendor details and line items.
              You will review and edit all extracted data before anything is saved to your purchase records.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === 'uploading'}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadState === 'uploading' ? 'Extracting data…' : 'Upload & Extract'}
          </button>
        </div>
      ) : (
        <DraftList drafts={drafts} loading={loadingDrafts} />
      )}
    </div>
  )
}

function groupByUploadMonth(drafts: PurchaseImportDraft[]): { label: string; drafts: PurchaseImportDraft[] }[] {
  const map = new Map<string, PurchaseImportDraft[]>()
  for (const draft of drafts) {
    const d = new Date(draft.created_at)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(draft)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({
      label: new Date(key + '-02T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      drafts: items,
    }))
}

function DraftList({
  drafts,
  loading,
}: {
  drafts: PurchaseImportDraft[] | null
  loading: boolean
}) {
  if (loading || drafts === null) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No scan imports yet.</p>
        <p className="text-slate-600 text-xs mt-1">Upload a receipt or invoice to get started.</p>
      </div>
    )
  }

  const groups = groupByUploadMonth(drafts)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-2 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.label}</span>
            <span className="text-xs text-slate-600">{group.drafts.length} upload{group.drafts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {group.drafts.map((draft) => (
              <a
                key={draft.id}
                href={`/purchase-scan/${draft.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {draft.document_upload?.filename ?? 'Unnamed document'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </span>
                    {draft.vendor_name && (
                      <span className="text-xs text-slate-500">{draft.vendor_name}</span>
                    )}
                    {draft.purchase_date && (
                      <span className="text-xs text-slate-500">· invoice {draft.purchase_date}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusPill status={draft.status} />
                  <span className="text-slate-600 group-hover:text-slate-400 text-xs">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: PurchaseImportDraft['status'] }) {
  const map = {
    pending: 'bg-amber-500/15 text-amber-400',
    confirmed: 'bg-emerald-500/15 text-emerald-400',
    cancelled: 'bg-slate-700 text-slate-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}>
      {status}
    </span>
  )
}
