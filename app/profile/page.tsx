'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function ProfileContent() {
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'

  const [barName, setBarName] = useState('')
  const [address, setAddress] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [username, setUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
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
        setUsername(d.username ?? '')
        setNewUsername(d.username ?? '')
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
      body: JSON.stringify({ bar_name: barName, address, contact_email: contactEmail }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok || data.error) {
      setProfileMsg({ type: 'error', text: data.error ?? 'Failed to save' })
    } else {
      setProfileMsg({ type: 'success', text: 'Saved!' })
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
            {saving ? 'Saving…' : 'Save Changes'}
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Free Plan</p>
            <p className="text-xs text-slate-500 mt-0.5">Unlimited inventory tracking, AI scanning, and reorder alerts.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">Active</span>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">Paid plans with advanced analytics and multi-location support coming soon.</p>
        </div>
      </div>
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
