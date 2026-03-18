'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface TrialState {
  plan: string
  daysLeft: number | null
  expired: boolean
}

export function TrialBanner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [trial, setTrial] = useState<TrialState | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        const plan = d.plan ?? 'basic'
        const trialEndsAt = d.trial_ends_at ?? null

        // Legacy/pro/enterprise or no trial set (grandfathered) = no restrictions
        if (!trialEndsAt || ['legacy', 'pro', 'enterprise'].includes(plan)) {
          setTrial({ plan, daysLeft: null, expired: false })
          return
        }

        const now = new Date()
        const end = new Date(trialEndsAt)
        const msLeft = end.getTime() - now.getTime()
        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
        const expired = msLeft <= 0

        setTrial({ plan, daysLeft, expired })
      })
      .catch(() => setTrial({ plan: 'basic', daysLeft: null, expired: false }))
  }, [pathname])

  async function handleUpgrade(plan: string) {
    setUpgrading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setUpgrading(null)
  }

  // Allow access to profile and upgrade pages even when expired
  const isExempt = pathname === '/profile' || pathname === '/upgrade'

  // Trial expired — show upgrade wall
  if (trial?.expired && !isExempt) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl max-w-lg w-full text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">⏰</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Your free trial has ended</h2>
            <p className="text-sm text-slate-400 mb-8">Choose a plan to keep using BarGuard and protect your bar&apos;s inventory.</p>

            <div className="space-y-3 mb-6">
              {[
                { plan: 'basic', name: 'Basic', price: '$99/mo', desc: 'Inventory, scanning, stock alerts' },
                { plan: 'pro', name: 'Pro', price: '$199/mo', desc: 'Everything + reorder & POS integration', highlight: true },
                { plan: 'enterprise', name: 'Enterprise', price: '$399/mo', desc: 'Everything + up to 5 locations' },
              ].map((p) => (
                <button
                  key={p.plan}
                  onClick={() => handleUpgrade(p.plan)}
                  disabled={!!upgrading}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-colors disabled:opacity-50 ${
                    p.highlight
                      ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/70'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {p.name}
                      {p.highlight && <span className="text-[10px] bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-400 ml-4 shrink-0">
                    {upgrading === p.plan ? 'Redirecting…' : p.price}
                  </span>
                </button>
              ))}
            </div>

            <Link href="/profile" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Go to account settings
            </Link>
          </div>
        </div>
        <div className="pointer-events-none opacity-20 blur-sm select-none">{children}</div>
      </>
    )
  }

  // In trial — show banner
  return (
    <>
      {trial?.daysLeft != null && typeof trial.daysLeft === 'number' && !isNaN(trial.daysLeft) && !trial?.expired && (
        <div className={`flex items-center justify-between px-4 py-2 text-xs font-medium ${
          (trial?.daysLeft ?? 0) <= 3
            ? 'bg-red-500/10 border-b border-red-500/20 text-red-400'
            : 'bg-amber-500/10 border-b border-amber-500/20 text-amber-400'
        }`}>
          <span>
            {trial?.daysLeft === 0
              ? 'Your trial expires today'
              : `${trial?.daysLeft} day${trial?.daysLeft === 1 ? '' : 's'} left in your free trial`}
          </span>
          <button
            onClick={() => router.push('/profile')}
            className="ml-4 underline hover:no-underline transition-all"
          >
            Upgrade now
          </button>
        </div>
      )}
      {children}
    </>
  )
}
