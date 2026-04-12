'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBusinessContext } from '@/app/(app)/BusinessContext'
import { CLIENT_ROLE_LABELS } from '@/lib/client-access'
import type { ClientRole } from '@/lib/client-access'

interface Member {
  id:                string
  user_id:           string
  role:              string   // 'owner' | 'member'
  client_role:       string
  joined_at:         string
  membership_status: string
}

interface Invite {
  id:                  string
  email:               string
  client_role:         string
  created_at:          string
  expires_at:          string
}

export default function TeamPage() {
  const { clientRole, isOwner, loading: ctxLoading } = useBusinessContext()
  const router = useRouter()

  const [members,  setMembers]  = useState<Member[]>([])
  const [invites,  setInvites]  = useState<Invite[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Invite form
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteRole,    setInviteRole]    = useState<ClientRole>('employee')
  const [inviting,      setInviting]      = useState(false)
  const [inviteMsg,     setInviteMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Guard: only admin/owner can see this page
  useEffect(() => {
    if (!ctxLoading && clientRole !== 'admin') {
      router.replace('/profile')
    }
  }, [ctxLoading, clientRole, router])

  function loadTeam() {
    setLoading(true)
    fetch('/api/team')
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members ?? [])
        setInvites(d.invites ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Failed to load team'); setLoading(false) })
  }

  useEffect(() => {
    if (!ctxLoading && clientRole === 'admin') loadTeam()
  }, [ctxLoading, clientRole])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    const res = await fetch('/api/team/invites', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: inviteEmail, client_role: inviteRole }),
    })
    const data = await res.json()
    setInviting(false)
    if (!res.ok) {
      setInviteMsg({ type: 'error', text: data.error ?? 'Failed to send invite' })
    } else {
      setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail}` })
      setInviteEmail('')
      loadTeam()
    }
  }

  async function revokeInvite(id: string) {
    if (!confirm('Revoke this invite?')) return
    const res = await fetch(`/api/team/invites/${id}`, { method: 'DELETE' })
    if (res.ok) loadTeam()
    else {
      const d = await res.json()
      alert(d.error ?? 'Failed to revoke invite')
    }
  }

  async function changeRole(id: string, role: ClientRole) {
    const res = await fetch(`/api/team/members/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ client_role: role }),
    })
    if (res.ok) loadTeam()
    else {
      const d = await res.json()
      alert(d.error ?? 'Failed to change role')
    }
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this member? They will immediately lose access.')) return
    const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
    if (res.ok) loadTeam()
    else {
      const d = await res.json()
      alert(d.error ?? 'Failed to remove member')
    }
  }

  if (ctxLoading || (clientRole !== 'admin')) {
    return <div className="p-6 text-slate-500 text-sm">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Team Members</h1>
        <p className="text-sm text-slate-500 mt-1">Invite staff and manage their access level.</p>
      </div>

      {/* Invite form */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wider">Invite a Team Member</h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="bartender@thebar.com"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ClientRole)}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="employee">Employee — Drink Library only</option>
                <option value="manager">Manager — Full app, no billing</option>
                <option value="admin">Admin — Full access + team management</option>
              </select>
            </div>
          </div>

          {inviteMsg && (
            <div className={`px-4 py-3 rounded-lg border text-sm ${
              inviteMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {inviteMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {inviting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Pending Invites</h2>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div>
                  <p className="text-sm text-slate-200">{inv.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {CLIENT_ROLE_LABELS[inv.client_role as ClientRole] ?? inv.client_role} · Expires{' '}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active members */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
          Active Members {loading ? '' : `(${members.length})`}
        </h2>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-slate-600 text-sm">No active members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const isThisOwner = m.role === 'owner'
              const effectiveRole = isThisOwner ? 'admin' : (m.client_role as ClientRole)
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200">
                        {isThisOwner ? 'Owner' : CLIENT_ROLE_LABELS[effectiveRole] ?? effectiveRole}
                      </span>
                      {isThisOwner && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">OWNER</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Joined {new Date(m.joined_at).toLocaleDateString()}
                    </p>
                  </div>

                  {!isThisOwner && (
                    <div className="flex items-center gap-2">
                      <select
                        value={effectiveRole}
                        onChange={(e) => changeRole(m.id, e.target.value as ClientRole)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
