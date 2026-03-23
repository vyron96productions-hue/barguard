'use client'

import { useEffect, useState } from 'react'

type Service = {
  name: string
  key: string
  ok: boolean
  latency: number
}

type StatusData = {
  status: 'operational' | 'degraded'
  services: Service[]
  checkedAt: string
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: ok ? '#22c55e' : '#ef4444',
      boxShadow: ok ? '0 0 6px #22c55e88' : '0 0 6px #ef444488',
      flexShrink: 0,
    }} />
  )
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError(false)
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  const allOk = data?.status === 'operational'
  const checkedAt = data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020817', padding: '64px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src="/barguard_icon.png" alt="BarGuard" style={{ height: 48, width: 'auto' }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>System Status</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Live status for all BarGuard services</p>
        </div>

        {/* Overall status banner */}
        <div style={{
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: loading ? '#0f172a' : allOk ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${loading ? '#1e293b' : allOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {loading ? (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #334155', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: allOk ? '#22c55e' : '#ef4444',
              boxShadow: allOk ? '0 0 8px #22c55e88' : '0 0 8px #ef444488',
            }} />
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#f8fafc' }}>
              {loading ? 'Checking services…' : error ? 'Unable to load status' : allOk ? 'All systems operational' : 'Service disruption detected'}
            </p>
            {checkedAt && !loading && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>Last checked at {checkedAt} — refreshes every 60s</p>
            )}
          </div>
        </div>

        {/* Service list */}
        <div style={{ borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
          {(data?.services ?? [
            { name: 'Application', key: 'app' },
            { name: 'Database', key: 'database' },
            { name: 'Payments', key: 'payments' },
            { name: 'AI Features', key: 'ai' },
            { name: 'Email', key: 'email' },
          ]).map((service, i, arr) => (
            <div
              key={service.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid #1e293b' : 'none',
                background: '#0f172a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {loading ? (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1e293b' }} />
                ) : (
                  <StatusDot ok={(service as Service).ok ?? true} />
                )}
                <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{service.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!loading && (service as Service).latency > 0 && (
                  <span style={{ fontSize: 12, color: '#475569' }}>{(service as Service).latency}ms</span>
                )}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: loading ? '#334155' : (service as Service).ok ?? true ? '#22c55e' : '#ef4444',
                }}>
                  {loading ? 'Checking…' : (service as Service).ok ?? true ? 'Operational' : 'Disrupted'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 32 }}>
          Issues? Contact us at{' '}
          <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>
            support@barguard.app
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
