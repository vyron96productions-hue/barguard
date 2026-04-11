'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg tracking-tight">BarGuard</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400 text-sm">Partner Portal</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
      <div style={{ borderTop: '1px solid #1e293b', padding: '12px 24px', display: 'flex', justifyContent: 'center' }}>
        <a href="https://verdictiq.org" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.04em' }}>Engineered By</span>
          <Image src="/verdictiq-logo.png" alt="VerdictIQ" width={100} height={34} style={{ height: 22, width: 'auto', display: 'block', filter: 'invert(1) hue-rotate(180deg) saturate(1.5)', opacity: 0.5 }} />
        </a>
      </div>
    </div>
  )
}
