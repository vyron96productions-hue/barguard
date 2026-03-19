'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { planHasFeature, type Plan } from '@/lib/plans'

interface PlanGateProps {
  children: React.ReactNode
  feature: string
  requiredPlan: 'basic' | 'pro' | 'enterprise'
  currentPlan: Plan
}

export function PlanGate({ children, feature, requiredPlan, currentPlan }: PlanGateProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (planHasFeature(currentPlan, requiredPlan)) {
    return <>{children}</>
  }

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: requiredPlan }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      router.push('/profile')
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
        <div className="text-center p-8 bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl max-w-sm mx-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-xl">🔒</div>
          <p className="text-sm font-semibold text-slate-100 mb-1">{feature}</p>
          <p className="text-xs text-slate-400 mb-5">
            Available on <span className="text-amber-400 font-medium">
              {requiredPlan === 'basic' ? 'Basic ($99/mo)' : requiredPlan === 'pro' ? 'Pro ($199/mo)' : 'Enterprise ($399/mo)'}
            </span> and above
          </p>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Redirecting…' : `Upgrade to ${requiredPlan === 'basic' ? 'Basic' : requiredPlan === 'pro' ? 'Pro' : 'Enterprise'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
