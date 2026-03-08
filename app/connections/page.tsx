'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { POS_PROVIDERS, type PosProviderMeta, type PosConnection, type PosSyncLog } from '@/lib/pos/types'

const ProviderIcon = ({ provider, size = 32 }: { provider: string; size?: number }) => {
  const icons: Record<string, string> = {
    square: 'SQ', toast: 'TS', clover: 'CV', lightspeed: 'LS',
  }
  const colors: Record<string, string> = {
    square: '#00B388', toast: '#FF4F00', clover: '#62BA46', lightspeed: '#E84E1B',
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

// ── Toast credentials modal ───────────────────────────────────────────────────
function ToastModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [fields, setFields] = useState({ clientId: '', clientSecret: '', restaurantGuid: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await fetch('/api/pos/toast/connect', {
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
          <ProviderIcon provider="toast" size={36} />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Connect Toast</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your Toast API credentials</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {POS_PROVIDERS.find(p => p.id === 'toast')!.credentialFields!.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{f.label}</label>
              <input
                required
                type={f.type ?? 'text'}
                placeholder={f.placeholder}
                value={(fields as any)[f.key]}
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
              {loading ? 'Connecting…' : 'Connect Toast'}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-slate-600 mt-4">
          Get your credentials at{' '}
          <a href="https://doc.toasttab.com" target="_blank" rel="noreferrer" className="text-amber-500/70 hover:text-amber-400">
            doc.toasttab.com
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
function ProviderCard({ meta, connection, onConnect, onDisconnect, onSync }: {
  meta: PosProviderMeta
  connection: PosConnection | null
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
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

      <div className="flex gap-2 mt-auto">
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
  const [toastModal, setToastModal] = useState(false)
  const [syncTarget, setSyncTarget] = useState<PosProviderMeta | null>(null)
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
      setToastModal(true)
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
      {toastModal && (
        <ToastModal onClose={() => setToastModal(false)} onConnected={loadConnections} />
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
