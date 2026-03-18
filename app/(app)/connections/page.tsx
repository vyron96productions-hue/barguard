'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { POS_PROVIDERS, type PosProviderMeta, type PosConnection, type PosSyncLog } from '@/lib/pos/types'

interface CloverCatalogItem {
  id: string
  name: string
  category: string | null
  suggestedUnit: string
}

// ── Clover import items modal ─────────────────────────────────────────────────
function CloverImportModal({ onClose, onImported }: { onClose: () => void; onImported: (count: number) => void }) {
  const [items, setItems] = useState<CloverCatalogItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [units, setUnits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/pos/clover/items')
      .then(r => r.json())
      .then((data: CloverCatalogItem[]) => {
        setItems(data)
        const u: Record<string, string> = {}
        const sel = new Set<string>()
        for (const item of data) {
          u[item.id] = item.suggestedUnit
          sel.add(item.id)
        }
        setUnits(u)
        setSelected(sel)
      })
      .catch(() => setErr('Failed to load Clover items'))
      .finally(() => setLoading(false))
  }, [])

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  async function importSelected() {
    setImporting(true); setErr('')
    const payload = items
      .filter(i => selected.has(i.id))
      .map(i => ({ name: i.name, unit: units[i.id] ?? 'bottle', category: i.category }))

    const res = await fetch('/api/pos/clover/import-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload }),
    })
    const data = await res.json()
    setImporting(false)
    if (res.ok) { onImported(data.imported); onClose() }
    else setErr(data.error ?? 'Import failed')
  }

  const UNIT_OPTIONS = ['bottle', '1l', '1.75l', 'can', 'keg', 'pint', 'case']

  return (
    <ModalBase onClose={onClose}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <ProviderIcon provider="clover" size={36} />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Import Items from Clover</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select items to add to your inventory</p>
          </div>
        </div>

        {loading && <p className="text-xs text-slate-500 py-6 text-center">Loading Clover catalog…</p>}
        {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

        {!loading && items.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500">{selected.size} of {items.length} selected</span>
              <button onClick={toggleAll} className="text-[10px] text-amber-400 hover:text-amber-300">
                {selected.size === items.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1 mb-4">
              {items.map(item => (
                <div key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selected.has(item.id) ? 'bg-slate-800/80' : 'bg-slate-800/20 opacity-50'
                }`} onClick={() => setSelected(prev => {
                  const n = new Set(prev)
                  n.has(item.id) ? n.delete(item.id) : n.add(item.id)
                  return n
                })}>
                  <input type="checkbox" readOnly checked={selected.has(item.id)}
                    className="accent-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate">{item.name}</p>
                    {item.category && <p className="text-[10px] text-slate-600">{item.category}</p>}
                  </div>
                  <select
                    value={units[item.id] ?? 'bottle'}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setUnits(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="text-[10px] bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-slate-300 shrink-0"
                  >
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && items.length === 0 && !err && (
          <p className="text-xs text-slate-500 py-6 text-center">No items found in your Clover catalog.</p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 sm:py-2 text-slate-500 hover:text-slate-300 text-sm rounded-xl sm:rounded-lg border border-slate-700/60 transition-colors">
            Cancel
          </button>
          <button onClick={importSelected} disabled={importing || selected.size === 0}
            className="flex-1 px-4 py-3 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-xl sm:rounded-lg transition-colors disabled:opacity-50">
            {importing ? 'Importing…' : `Import ${selected.size} Items`}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

const ProviderIcon = ({ provider, size = 32 }: { provider: string; size?: number }) => {
  const icons: Record<string, string> = {
    square: 'SQ', toast: 'TS', clover: 'CV', lightspeed: 'LS', heartland: 'HL',
  }
  const colors: Record<string, string> = {
    square: '#00B388', toast: '#FF4F00', clover: '#62BA46', lightspeed: '#E84E1B', heartland: '#E31837',
  }
  return (
    <div
      style={{ width: size, height: size, background: colors[provider], borderRadius: 8 }}
      className="flex items-center justify-center text-white font-black text-xs shrink-0"
    >
      {icons[provider] ?? '??'}
    </div>
  )
}

// ── Modal base (bottom sheet on mobile, centered on desktop) ─────────────────
function ModalBase({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// ── Generic credentials modal (Toast, Heartland, any future credential provider) ──
function CredentialsModal({ meta, onClose, onConnected }: { meta: PosProviderMeta; onClose: () => void; onConnected: () => void }) {
  const initialFields = Object.fromEntries((meta.credentialFields ?? []).map(f => [f.key, '']))
  const [fields, setFields] = useState<Record<string, string>>(initialFields)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await fetch(`/api/pos/${meta.id}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { onConnected(); onClose() }
    else setErr(data.error ?? 'Connection failed')
  }

  return (
    <ModalBase onClose={onClose}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <ProviderIcon provider={meta.id} size={36} />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Connect {meta.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your {meta.name} API credentials</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {(meta.credentialFields ?? []).map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{f.label}</label>
              <input
                required
                type={f.type ?? 'text'}
                placeholder={f.placeholder}
                value={fields[f.key]}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-3 sm:py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          ))}
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2 text-slate-500 hover:text-slate-300 text-sm rounded-xl sm:rounded-lg border border-slate-700/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-xl sm:rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : `Connect ${meta.name}`}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-slate-600 mt-4">
          Need help?{' '}
          <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-amber-500/70 hover:text-amber-400">
            {meta.docsUrl.replace('https://', '')}
          </a>
        </p>
      </div>
    </ModalBase>
  )
}

// ── Sync modal ────────────────────────────────────────────────────────────────
function SyncModal({ provider, onClose, onSynced }: { provider: PosProviderMeta; onClose: () => void; onSynced: (count: number) => void }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function runSync() {
    if (!start || !end) return
    setLoading(true); setErr('')
    const res = await fetch(`/api/pos/${provider.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: start, period_end: end }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { onSynced(data.imported); onClose() }
    else setErr(data.error ?? 'Sync failed')
  }

  return (
    <ModalBase onClose={onClose}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <ProviderIcon provider={provider.id} size={32} />
          <h2 className="text-sm font-semibold text-slate-100">Sync {provider.name} Sales</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">From</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-3 sm:py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">To</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-3 sm:py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2 text-slate-500 hover:text-slate-300 text-sm rounded-xl sm:rounded-lg border border-slate-700/60 transition-colors">
              Cancel
            </button>
            <button onClick={runSync} disabled={loading || !start || !end}
              className="flex-1 px-4 py-3 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-xl sm:rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Provider card ─────────────────────────────────────────────────────────────
function ProviderCard({ meta, connection, onConnect, onDisconnect, onSync, onImport }: {
  meta: PosProviderMeta
  connection: PosConnection | null
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
  onImport?: () => void
}) {
  const connected = !!connection
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 transition-all duration-200 ${
      connected ? 'bg-slate-900/70 border-emerald-500/20' : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={meta.id} size={36} />
          <div>
            <p className="text-sm font-semibold text-slate-100">{meta.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">POS Integration</p>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
          connected
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-slate-800 text-slate-500 border border-slate-700/60'
        }`}>
          {connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>

      {connected && connection && (
        <div className="space-y-1 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs text-slate-300 font-medium">{connection.location_name ?? 'Connected'}</p>
          </div>
          {connection.last_synced_at && (
            <p className="text-[10px] text-slate-600 pl-3.5">
              Last synced: {new Date(connection.last_synced_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-auto flex-wrap">
        {connected ? (
          <>
            <button onClick={onSync}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-900 font-semibold text-xs rounded-xl sm:rounded-lg transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6A4 4 0 112 6" />
                <path strokeLinecap="round" d="M10 6l-1.5-1.5M10 6l1.5-1.5" />
              </svg>
              Sync Sales
            </button>
            {onImport && (
              <button onClick={onImport}
                className="flex-1 px-3 py-2.5 sm:py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl sm:rounded-lg transition-colors">
                Import Items
              </button>
            )}
            <button onClick={onDisconnect}
              className="px-3 py-2.5 sm:py-2 text-slate-600 hover:text-red-400 text-xs rounded-xl sm:rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-500/5 transition-colors">
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={onConnect}
            className="flex-1 px-3 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-slate-100 font-medium text-xs rounded-xl sm:rounded-lg border border-slate-700/60 transition-colors">
            Connect {meta.name}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ConnectionsPage() {
  return (
    <Suspense>
      <ConnectionsContent />
    </Suspense>
  )
}

function ConnectionsContent() {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<PosConnection[]>([])
  const [syncLogs, setSyncLogs] = useState<PosSyncLog[]>([])
  const [credentialsModal, setCredentialsModal] = useState<PosProviderMeta | null>(null)
  const [syncTarget, setSyncTarget] = useState<PosProviderMeta | null>(null)
  const [cloverImportModal, setCloverImportModal] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const loadConnections = useCallback(async () => {
    const [connRes, logRes] = await Promise.all([
      fetch('/api/pos/connections').then(r => r.json()),
      fetch('/api/pos/sync-logs').then(r => r.json()).catch(() => []),
    ])
    setConnections(Array.isArray(connRes) ? connRes : [])
    setSyncLogs(Array.isArray(logRes) ? logRes : [])
  }, [])

  useEffect(() => {
    loadConnections()
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success) setBanner({ type: 'success', msg: `${success} connected successfully!` })
    if (error) setBanner({ type: 'error', msg: `Connection failed: ${error}` })
  }, [loadConnections, searchParams])

  function getConnection(provider: string): PosConnection | null {
    return connections.find(c => c.pos_type === provider) ?? null
  }

  async function disconnect(provider: string) {
    if (!confirm(`Disconnect ${provider}?`)) return
    await fetch('/api/pos/connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    loadConnections()
  }

  function handleConnect(meta: PosProviderMeta) {
    if (meta.authType === 'credentials') {
      setCredentialsModal(meta)
    } else {
      window.location.href = `/api/pos/${meta.id}/connect`
    }
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">POS Connections</h1>
          <p className="text-sm text-slate-500 mt-1">Connect your point-of-sale system to auto-sync sales data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 shrink-0">
          <span className="text-xs text-slate-400">{connections.length}/{POS_PROVIDERS.length}</span>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          banner.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <span>{banner.type === 'success' ? '✓' : '⚠'}</span>
          <span className="flex-1 text-xs sm:text-sm">{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100 shrink-0">✕</button>
        </div>
      )}

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {POS_PROVIDERS.map(meta => (
          <ProviderCard
            key={meta.id}
            meta={meta}
            connection={getConnection(meta.id)}
            onConnect={() => handleConnect(meta)}
            onDisconnect={() => disconnect(meta.id)}
            onSync={() => setSyncTarget(meta)}
            onImport={meta.id === 'clover' ? () => setCloverImportModal(true) : undefined}
          />
        ))}
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/40 p-4 sm:p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Connect Your POS', desc: 'Authorize BarGuard to read your sales data via OAuth or API credentials.' },
            { step: '2', title: 'Sync Sales Data', desc: 'Pick a date range and pull your order history directly — no CSV export needed.' },
            { step: '3', title: 'Run Calculations', desc: 'Head to the Dashboard, run variance calculations, and get AI-powered insights.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-amber-400">{item.step}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">{item.title}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync log */}
      {syncLogs.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold text-slate-100">Recent Syncs</h2>
          </div>
          <div className="divide-y divide-slate-800/40">
            {syncLogs.slice(0, 10).map(log => (
              <div key={log.id} className="px-4 sm:px-5 py-3">
                {/* Mobile layout */}
                <div className="sm:hidden flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ProviderIcon provider={log.pos_type} size={20} />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 capitalize">{log.pos_type}</p>
                      <p className="text-[10px] text-slate-600">{log.period_start} → {log.period_end}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">{log.transactions_imported} rows</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-12 gap-3 items-center text-xs">
                  <div className="col-span-2 flex items-center gap-2">
                    <ProviderIcon provider={log.pos_type} size={20} />
                    <span className="text-slate-400 capitalize">{log.pos_type}</span>
                  </div>
                  <div className="col-span-3 text-slate-500">{log.period_start} → {log.period_end}</div>
                  <div className="col-span-3 text-slate-500">
                    {new Date(log.synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="col-span-2 text-slate-400">{log.transactions_imported} rows</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {credentialsModal && (
        <CredentialsModal meta={credentialsModal} onClose={() => setCredentialsModal(null)} onConnected={loadConnections} />
      )}
      {cloverImportModal && (
        <CloverImportModal
          onClose={() => setCloverImportModal(false)}
          onImported={(count) => {
            setBanner({ type: 'success', msg: `Imported ${count} items into inventory` })
            setCloverImportModal(false)
          }}
        />
      )}
      {syncTarget && (
        <SyncModal
          provider={syncTarget}
          onClose={() => setSyncTarget(null)}
          onSynced={(count) => {
            setBanner({ type: 'success', msg: `Synced ${count} transactions from ${syncTarget.name}` })
            setSyncTarget(null)
            loadConnections()
          }}
        />
      )}
    </div>
  )
}
