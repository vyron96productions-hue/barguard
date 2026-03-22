'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type OnboardingStatus = 'active' | 'trial' | 'pending_payment'

interface Merchant {
  id: string
  name: string
  plan: string
  contact_email: string | null
  created_at: string
  account_type: string
  has_subscription: boolean
  onboarding_status: OnboardingStatus
}

interface Summary {
  total_merchants: number
  active_merchants: number
  paying_merchants: number
  total_mrr: number
  estimated_payout: number
}

interface Partner {
  id: string
  name: string
  partner_code: string
  status: string
  pricing_type: string
  revenue_share_pct: number | null
  wholesale_price: number | null
}

interface DashboardData {
  partner: Partner
  merchants: Merchant[]
  summary: Summary
}

const STATUS_CONFIG: Record<OnboardingStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-emerald-400 bg-emerald-500/10' },
  trial: { label: 'Trial', className: 'text-yellow-400 bg-yellow-500/10' },
  pending_payment: { label: 'Pending Payment', className: 'text-slate-400 bg-slate-700' },
}

const PLAN_LABELS: Record<string, string> = {
  legacy: 'Legacy',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/partner/dashboard')
      .then((r) => {
        if (r.status === 401 || r.status === 403) { router.push('/login'); return null }
        return r.json()
      })
      .then((d) => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 text-sm">Unable to load dashboard. Please try again.</p>
      </div>
    )
  }

  const { partner, merchants, summary } = data
  const filtered = merchants.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.contact_email?.toLowerCase().includes(search.toLowerCase())
  )

  const payoutLabel =
    partner.pricing_type === 'rev_share'
      ? `${partner.revenue_share_pct ?? 0}% rev share`
      : partner.pricing_type === 'wholesale'
      ? `$${partner.wholesale_price ?? 0}/merchant`
      : 'Custom agreement'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
          Partner Code: <span className="font-mono text-amber-400">{partner.partner_code}</span>
        </p>
        <h1 className="text-2xl font-bold text-slate-100">{partner.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pricing: {payoutLabel}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Active Merchants</p>
          <p className="text-3xl font-bold text-slate-100">{summary.active_merchants}</p>
          <p className="text-xs text-slate-600 mt-1">of {summary.total_merchants} total</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Paying Accounts</p>
          <p className="text-3xl font-bold text-amber-400">{summary.paying_merchants}</p>
          <p className="text-xs text-slate-600 mt-1">with active subscription</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Merchant MRR</p>
          <p className="text-3xl font-bold text-slate-100">${summary.total_mrr.toLocaleString()}</p>
          <p className="text-xs text-slate-600 mt-1">monthly recurring revenue</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Est. Payout</p>
          <p className="text-3xl font-bold text-emerald-400">
            {partner.pricing_type === 'custom' ? '—' : `$${summary.estimated_payout.toLocaleString()}`}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {partner.pricing_type === 'custom' ? 'per custom agreement' : 'per month'}
          </p>
        </div>
      </div>

      {/* Merchant list */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-200">Your Merchant Accounts</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants…"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors w-56"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-600 text-sm">
              {merchants.length === 0
                ? 'No merchant accounts assigned yet. Contact your BarGuard rep to get started.'
                : 'No merchants match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['Account Name', 'Contact', 'Plan', 'Start Date', 'Status'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((m) => {
                  const statusCfg = STATUS_CONFIG[m.onboarding_status]
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-100">{m.name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {m.contact_email ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">
                          {PLAN_LABELS[m.plan] ?? m.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-700 text-center">
        {filtered.length} of {merchants.length} accounts
      </p>

      {/* Payout notice */}
      {partner.pricing_type !== 'custom' && summary.estimated_payout > 0 && (
        <div className="mt-6 px-5 py-4 bg-slate-900 border border-slate-800/60 rounded-xl text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Estimated Payout: </span>
          ${summary.estimated_payout.toLocaleString()}/mo based on {summary.paying_merchants} paying
          account{summary.paying_merchants !== 1 ? 's' : ''} at {payoutLabel}.
          Payouts are processed per your partner agreement terms. Contact your BarGuard rep with questions.
        </div>
      )}
    </div>
  )
}
