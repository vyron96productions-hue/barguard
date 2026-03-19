'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Plan = 'legacy' | 'basic' | 'pro' | 'enterprise'

interface Account {
  business_id: string
  bar_name: string
  plan: Plan
  contact_email: string | null
  created_at: string
  has_subscription: boolean
  user_id: string
  username: string | null
  is_admin: boolean
}

interface Stats {
  total: number
  legacy: number
  basic: number
  pro: number
  enterprise: number
}

const PLAN_COLORS: Record<Plan, string> = {
  legacy: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  basic: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  pro: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  enterprise: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
}

export default function AdminPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [resetSending, setResetSending] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          router.push('/')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setAccounts(d.accounts ?? [])
        setStats(d.stats ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function updatePlan(businessId: string, plan: Plan) {
    setSaving(businessId)
    setError(null)
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, plan }),
    })
    const data = await res.json()
    setSaving(null)
    if (data.ok) {
      setAccounts((prev) => prev.map((a) => a.business_id === businessId ? { ...a, plan } : a))
    } else {
      setError(data.error ?? 'Failed to update')
    }
  }

  function toggleExpand(account: Account) {
    if (expandedAccount === account.business_id) {
      setExpandedAccount(null)
    } else {
      setExpandedAccount(account.business_id)
      setEditName(account.bar_name)
      setEditEmail(account.contact_email ?? '')
    }
  }

  async function saveEdit(businessId: string) {
    setEditSaving(true)
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, bar_name: editName, contact_email: editEmail }),
    })
    const data = await res.json()
    setEditSaving(false)
    if (data.ok) {
      setAccounts((prev) => prev.map((a) => a.business_id === businessId
        ? { ...a, bar_name: editName, contact_email: editEmail }
        : a
      ))
      setExpandedAccount(null)
    } else {
      setError(data.error ?? 'Failed to save')
    }
  }

  async function sendPasswordReset(account: Account) {
    if (!account.contact_email) {
      setError('This account has no contact email set.')
      return
    }
    setResetSending(account.user_id)
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: account.user_id, contact_email: account.contact_email }),
    })
    const data = await res.json()
    setResetSending(null)
    if (data.ok) {
      setResetSent(account.user_id)
      setTimeout(() => setResetSent(null), 3000)
    } else {
      setError(data.error ?? 'Failed to send reset email')
    }
  }

  const filtered = accounts.filter((a) =>
    a.bar_name.toLowerCase().includes(search.toLowerCase()) ||
    a.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.contact_email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all BarGuard accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admin Only</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-100' },
            { label: 'Legacy', value: stats.legacy, color: 'text-purple-400' },
            { label: 'Basic', value: stats.basic, color: 'text-slate-400' },
            { label: 'Pro', value: stats.pro, color: 'text-amber-400' },
            { label: 'Enterprise', value: stats.enterprise, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bar name, username, or email…"
          className="w-full bg-slate-900 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
        />
      </div>

      {/* Accounts table */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bar</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-600 text-sm">
                    No accounts found
                  </td>
                </tr>
              )}
              {filtered.map((account) => (
                <React.Fragment key={account.business_id}>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-100">{account.bar_name}</p>
                    {account.is_admin && (
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Admin</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {account.username ? `@${account.username}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {account.contact_email ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {account.created_at
                      ? new Date(account.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${PLAN_COLORS[account.plan]}`}>
                      {account.plan.charAt(0).toUpperCase() + account.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={account.plan}
                      disabled={saving === account.business_id}
                      onChange={(e) => updatePlan(account.business_id, e.target.value as Plan)}
                      className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                    >
                      <option value="legacy">Legacy (Free)</option>
                      <option value="basic">Basic ($99/mo)</option>
                      <option value="pro">Pro ($199/mo)</option>
                      <option value="enterprise">Enterprise ($399/mo)</option>
                    </select>
                    {saving === account.business_id && (
                      <span className="ml-2 text-xs text-slate-500">Saving…</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sendPasswordReset(account)}
                        disabled={resetSending === account.user_id}
                        className="text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {resetSending === account.user_id ? 'Sending…' : resetSent === account.user_id ? 'Sent ✓' : 'Reset Password'}
                      </button>
                      <button
                        onClick={() => toggleExpand(account)}
                        className="text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                      >
                        {expandedAccount === account.business_id ? 'Close' : 'Edit'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedAccount === account.business_id && (
                  <tr className="bg-slate-800/40">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="flex items-end gap-3 flex-wrap">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bar Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 w-48"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Contact Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 w-56"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(account.business_id)}
                          disabled={editSaving}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setExpandedAccount(null)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-700 text-center">
        {filtered.length} of {accounts.length} accounts
      </p>
    </div>
  )
}
