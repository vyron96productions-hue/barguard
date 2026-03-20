'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function ProfileContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isNew = searchParams.get('new') === '1'
  const isUpgraded = searchParams.get('upgraded') === '1'
  const urlPlan = searchParams.get('plan') ?? 'unknown'
  const urlBilling = searchParams.get('billing') ?? 'monthly'

  useEffect(() => {
    if (!isUpgraded) return
    if (sessionStorage.getItem('plan_purchased_fired')) return
    sessionStorage.setItem('plan_purchased_fired', '1')
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'plan_purchased',
      plan_name: urlPlan,
      billing_period: urlBilling,
    })
  }, [isUpgraded, urlPlan, urlBilling])

  const [barName, setBarName] = useState('')
  const [address, setAddress] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [barType, setBarType] = useState('')
  const [username, setUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [plan, setPlan] = useState('basic')
  const [hasSubscription, setHasSubscription] = useState(false)
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null)
  const [managingBilling, setManagingBilling] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        setBarName(d.bar_name ?? '')
        setAddress(d.address ?? '')
        setContactEmail(d.contact_email ?? '')
        setPhone(d.phone ?? '')
        setBarType(d.bar_type ?? '')
        setUsername(d.username ?? '')
        setNewUsername(d.username ?? '')
        setPlan(d.plan ?? 'basic')
        setHasSubscription(d.has_subscription ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bar_name: barName, address, contact_email: contactEmail, phone, bar_type: barType }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok || data.error) {
      setProfileMsg({ type: 'error', text: data.error ?? 'Failed to save' })
    } else {
      if (isNew) {
        router.push('/pricing')
      } else {
        setProfileMsg({ type: 'success', text: 'Saved!' })
      }
    }
  }

  async function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault()
    if (newUsername === username) {
      setUsernameMsg({ type: 'error', text: 'That is already your username.' })
      return
    }
    setSavingUsername(true)
    setUsernameMsg(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    })

    const data = await res.json()
    setSavingUsername(false)

    if (!res.ok || data.error) {
      setUsernameMsg({ type: 'error', text: data.error ?? 'Failed to update username' })
    } else {
      setUsername(data.username ?? newUsername)
      setUsernameMsg({ type: 'success', text: 'Username updated!' })
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated!' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-500 text-sm">Loading…</div>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {isNew && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
          Welcome to BarGuard! Update your bar name and details below to get started.
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-100">Account Settings</h1>
        {username && <p className="text-sm text-slate-500 mt-1">@{username}</p>}
      </div>

      {/* Bar Info */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">Bar Info</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Bar Name</label>
            <input
              type="text"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
              required
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Bar Type</label>
            <select
              value={barType}
              onChange={(e) => setBarType(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            >
              <option value="">Select type…</option>
              <option value="bar">Bar / Pub</option>
              <option value="sports_bar">Sports Bar</option>
              <option value="nightclub">Nightclub</option>
              <option value="restaurant_bar">Restaurant & Bar</option>
              <option value="hotel_bar">Hotel Bar</option>
              <option value="brewery">Brewery / Taproom</option>
              <option value="lounge">Lounge / Cocktail Bar</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="manager@thebar.com"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
            <p className="mt-1.5 text-xs text-slate-600">Used for reorder emails, reports, and password recovery.</p>
          </div>

          {profileMsg && (
            <div className={`px-4 py-3 rounded-lg border text-sm ${
              profileMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Save & Choose a Plan →' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Username */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wider">Change Username</h2>
        <p className="text-xs text-slate-600 mb-5">This is what you use to log in to BarGuard.</p>
        <form onSubmit={handleChangeUsername} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">New Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              pattern="[a-zA-Z0-9_-]+"
              title="Letters, numbers, underscores, and hyphens only"
              placeholder={username}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
            <p className="mt-1.5 text-xs text-slate-600">Letters, numbers, _ and - only.</p>
          </div>

          {usernameMsg && (
            <div className={`px-4 py-3 rounded-lg border text-sm ${
              usernameMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {usernameMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingUsername}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-slate-100 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingUsername ? 'Updating…' : 'Update Username'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          {passwordMsg && (
            <div className={`px-4 py-3 rounded-lg border text-sm ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {passwordMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-slate-100 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingPassword ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Billing / Plan */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">Billing &amp; Plan</h2>

        {/* Current plan */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Current Plan: <span className="text-amber-400">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {plan === 'legacy' && 'Full access — Legacy member'}
              {plan === 'basic' && '$99/mo — Inventory, scanning, and alerts'}
              {plan === 'pro' && '$199/mo — Everything + reorder & POS'}
              {plan === 'enterprise' && '$399/mo — Everything + up to 5 locations'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">Active</span>
        </div>

        {/* Upgrade options */}
        {plan !== 'legacy' && plan !== 'enterprise' && (
          <div className="space-y-3 mb-6">
            {plan === 'basic' && (
              <PlanCard
                name="Pro"
                price="$199/mo"
                description="Full history, vendor management, automated reorder, POS integration, data export"
                onUpgrade={async () => {
                  setUpgradingTo('pro')
                  const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: 'pro' }),
                  })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                  else setUpgradingTo(null)
                }}
                loading={upgradingTo === 'pro'}
              />
            )}
            <PlanCard
              name="Enterprise"
              price="$399/mo"
              description="Everything in Pro + up to 5 locations and priority support"
              onUpgrade={async () => {
                setUpgradingTo('enterprise')
                const res = await fetch('/api/stripe/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan: 'enterprise' }),
                })
                const data = await res.json()
                if (data.url) window.location.href = data.url
                else setUpgradingTo(null)
              }}
              loading={upgradingTo === 'enterprise'}
            />
          </div>
        )}

        {/* Manage subscription */}
        {hasSubscription && plan !== 'legacy' && (
          <button
            onClick={async () => {
              setManagingBilling(true)
              const res = await fetch('/api/stripe/portal', { method: 'POST' })
              const data = await res.json()
              if (data.url) window.location.href = data.url
              else setManagingBilling(false)
            }}
            disabled={managingBilling}
            className="text-sm text-slate-400 hover:text-slate-200 underline transition-colors disabled:opacity-50"
          >
            {managingBilling ? 'Redirecting…' : 'Manage subscription / Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}

function PlanCard({ name, price, description, onUpgrade, loading }: {
  name: string
  price: string
  description: string
  onUpgrade: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-800/40">
      <div>
        <p className="text-sm font-semibold text-slate-100">{name} <span className="text-amber-400">{price}</span></p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onUpgrade}
        disabled={loading}
        className="ml-4 shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
      >
        {loading ? 'Redirecting…' : 'Upgrade'}
      </button>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading…</div>}>
      <ProfileContent />
    </Suspense>
  )
}
