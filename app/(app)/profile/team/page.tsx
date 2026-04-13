'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBusinessContext } from '@/app/(app)/BusinessContext'
import { CLIENT_ROLE_LABELS } from '@/lib/client-access'
import type { ClientRole } from '@/lib/client-access'
import type { ActivityLogEntry } from '@/app/api/team/activity/route'

interface Member {
  id:                string
  user_id:           string
  role:              string
  client_role:       string
  joined_at:         string
  membership_status: string
  display_name:      string | null
  email:             string | null
}

interface Invite {
  id:           string
  email:        string
  display_name: string | null
  client_role:  string
  created_at:   string
  expires_at:   string
}

const ACTION_LABELS: Record<string, string> = {
  inventory_count: 'Submitted inventory count',
  member_invited:  'Invited team member',
  member_removed:  'Removed team member',
  role_changed:    'Changed member role',
}

function actorName(entry: ActivityLogEntry): string {
  return entry.display_name ?? 'Unknown'
}

function actionDescription(entry: ActivityLogEntry): string {
  const label = ACTION_LABELS[entry.action] ?? entry.action
  const d = entry.details as Record<string, unknown> | null
  if (!d) return label

  if (entry.action === 'inventory_count') {
    return `Submitted inventory count — ${d.item_count} items on ${d.count_date}`
  }
  if (entry.action === 'member_invited') {
    const name = d.invited_name ? `${d.invited_name} (${d.invited_email})` : String(d.invited_email)
    return `Invited ${name} as ${d.role}`
  }
  if (entry.action === 'member_removed') {
    const who = d.removed_name ? `${d.removed_name}` : d.removed_email ? String(d.removed_email) : 'a member'
    return `Removed ${who}`
  }
  if (entry.action === 'role_changed') {
    const who = d.member_name ? String(d.member_name) : 'a member'
    return `Changed ${who}'s role from ${d.old_role} to ${d.new_role}`
  }
  return label
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TeamPage() {
  const { clientRole, isOwner, loading: ctxLoading } = useBusinessContext()
  const router = useRouter()

  const [members,  setMembers]  = useState<Member[]>([])
  const [invites,  setInvites]  = useState<Invite[]>([])
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Invite form
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteName,    setInviteName]    = useState('')
  const [inviteRole,    setInviteRole]    = useState<ClientRole>('employee')
  const [inviting,      setInviting]      = useState(false)
  const [inviteMsg,     setInviteMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Inline name editing
  const [editingNameId,  setEditingNameId]  = useState<string | null>(null)
  const [editingNameVal, setEditingNameVal] = useState('')
  const [savingNameId,   setSavingNameId]   = useState<string | null>(null)

  useEffect(() => {
    if (!ctxLoading && clientRole !== 'admin') {
      router.replace('/profile')
    }
  }, [ctxLoading, clientRole, router])

  function loadTeam() {
    setLoading(true)
    Promise.all([
      fetch('/api/team').then((r) => r.json()),
      fetch('/api/team/activity').then((r) => r.json()),
    ])
      .then(([team, log]) => {
        setMembers(team.members ?? [])
        setInvites(team.invites ?? [])
        setActivity(Array.isArray(log) ? log : [])
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
      body:    JSON.stringify({ email: inviteEmail, client_role: inviteRole, display_name: inviteName }),
    })
    const data = await res.json()
    setInviting(false)
    if (!res.ok) {
      setInviteMsg({ type: 'error', text: data.error ?? 'Failed to send invite' })
    } else {
      setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail}` })
      setInviteEmail('')
      setInviteName('')
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

  async function saveName(id: string) {
    setSavingNameId(id)
    const res = await fetch(`/api/team/members/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ display_name: editingNameVal }),
    })
    setSavingNameId(null)
    if (res.ok) {
      setEditingNameId(null)
      loadTeam()
    } else {
      const d = await res.json()
      alert(d.error ?? 'Failed to save name')
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
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
            <div>
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
            <div className="sm:col-span-2">
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
                  {inv.display_name && (
                    <p className="text-sm font-medium text-slate-200">{inv.display_name}</p>
                  )}
                  <p className={`text-sm ${inv.display_name ? 'text-slate-400' : 'text-slate-200'}`}>{inv.email}</p>
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
              const isEditingName = editingNameId === m.id

              return (
                <div key={m.id} className="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    {/* Identity */}
                    <div className="min-w-0">
                      {/* Name row */}
                      {isEditingName ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingNameVal}
                            onChange={(e) => setEditingNameVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName(m.id)
                              if (e.key === 'Escape') setEditingNameId(null)
                            }}
                            placeholder="Enter name…"
                            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 w-40"
                          />
                          <button
                            onClick={() => saveName(m.id)}
                            disabled={savingNameId === m.id}
                            className="text-xs text-amber-400 hover:text-amber-300 font-medium disabled:opacity-50"
                          >
                            {savingNameId === m.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingNameId(null)}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-100">
                            {m.display_name ?? (isThisOwner ? 'Owner' : 'Unnamed')}
                          </span>
                          {isThisOwner && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">OWNER</span>
                          )}
                          {!isThisOwner && (
                            <button
                              onClick={() => { setEditingNameId(m.id); setEditingNameVal(m.display_name ?? '') }}
                              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                            >
                              {m.display_name ? 'Edit' : '+ Add name'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Email */}
                      {m.email && (
                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      )}

                      {/* Role + joined */}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {CLIENT_ROLE_LABELS[effectiveRole] ?? effectiveRole} · Joined {new Date(m.joined_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    {!isThisOwner && (
                      <div className="flex items-center gap-2 shrink-0">
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
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Activity Log</h2>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : activity.length === 0 ? (
          <p className="text-slate-600 text-sm">No activity recorded yet. Actions like inventory counts and member changes will appear here.</p>
        ) : (
          <div className="space-y-1">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                {/* Icon */}
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                  {entry.action === 'inventory_count' && (
                    <svg className="w-3.5 h-3.5 text-amber-400/70" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" d="M2 4h12M2 8h8M2 12h6" />
                    </svg>
                  )}
                  {(entry.action === 'member_invited' || entry.action === 'member_removed') && (
                    <svg className="w-3.5 h-3.5 text-blue-400/70" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="8" cy="5" r="3" />
                      <path strokeLinecap="round" d="M2 14c0-3 2.7-5 6-5s6 2 6 5" />
                    </svg>
                  )}
                  {entry.action === 'role_changed' && (
                    <svg className="w-3.5 h-3.5 text-purple-400/70" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{actionDescription(entry)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {actorName(entry)} · {fmtRelative(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
