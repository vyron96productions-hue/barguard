'use client'

import { useEffect, useState } from 'react'
import type { Vendor } from '@/types'
import { PlanGate } from '@/components/PlanGate'
import type { Plan } from '@/lib/plans'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan>('basic')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [repName, setRepName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRepName, setEditRepName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
    fetch('/api/profile').then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan) })
  }, [])

  async function fetchVendors() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendors')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setVendors(Array.isArray(data) ? data : [])
    } catch { /* network error — vendors list stays empty */ }
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rep_name: repName || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setName(''); setEmail(''); setRepName('')
    fetchVendors()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vendor? Items assigned to them will be unlinked.')) return
    const res = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete vendor')
      return
    }
    fetchVendors()
  }

  function openEdit(vendor: Vendor) {
    setEditingId(vendor.id)
    setEditName(vendor.name)
    setEditEmail(vendor.email)
    setEditRepName(vendor.rep_name ?? '')
    setEditError(null)
  }

  async function saveEdit() {
    if (!editingId) return
    setEditSaving(true)
    setEditError(null)
    const res = await fetch('/api/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        name: editName,
        email: editEmail,
        rep_name: editRepName || null,
      }),
    })
    const data = await res.json()
    setEditSaving(false)
    if (!res.ok) { setEditError(data.error ?? 'Save failed'); return }
    setEditingId(null)
    fetchVendors()
  }

  return (
    <PlanGate feature="Vendor Management" requiredPlan="basic" currentPlan={plan}>
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Vendors</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your suppliers and their contact details for reorder orders.</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="font-medium text-slate-200 text-sm">Add Vendor</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Vendor name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Southern Wine & Spirits"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Rep name <span className="text-slate-700">(optional)</span></label>
            <input
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@vendor.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim() || !email.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Adding…' : 'Add Vendor'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {/* Vendors list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 text-slate-700 border border-slate-800 border-dashed rounded-2xl">
          <p className="text-3xl mb-3">◷</p>
          <p className="text-sm">No vendors yet. Add your first vendor above.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-800/40">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {vendors.map((vendor) => (
              <div key={vendor.id}>
                {editingId === vendor.id ? (
                  <div className="px-4 sm:px-5 py-4 bg-slate-800/40 space-y-3">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Edit Vendor</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Rep name <span className="text-slate-700">(optional)</span></label>
                        <input
                          value={editRepName}
                          onChange={(e) => setEditRepName(e.target.value)}
                          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                        />
                      </div>
                    </div>
                    {editError && <p className="text-red-400 text-xs">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={editSaving}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-xs disabled:opacity-50 transition-colors"
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200">{vendor.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-slate-500">{vendor.email}</p>
                        {vendor.rep_name && (
                          <span className="text-xs text-slate-600">· {vendor.rep_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        onClick={() => openEdit(vendor)}
                        className="text-xs text-slate-500 hover:text-amber-400 transition-colors py-1 px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="text-xs text-slate-700 hover:text-red-400 active:text-red-300 transition-colors py-1 px-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  )
}
