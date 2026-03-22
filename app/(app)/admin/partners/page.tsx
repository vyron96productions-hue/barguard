'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type PartnerStatus = 'pending' | 'active' | 'suspended'
type PricingType = 'rev_share' | 'wholesale' | 'custom'

interface Partner {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string | null
  partner_code: string
  status: PartnerStatus
  pricing_type: PricingType
  revenue_share_pct: number | null
  wholesale_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
  merchant_count: number
  active_merchant_count: number
  mrr: number
}

interface Merchant {
  id: string
  name: string
  plan: string
  contact_email: string | null
  created_at: string
  account_type: string
  stripe_subscription_id: string | null
  has_subscription: boolean
}

interface AllMerchant {
  business_id: string
  bar_name: string
  plan: string
  contact_email: string | null
  partner_id: string | null
}

interface Stats {
  total_partners: number
  active_partners: number
  total_merchants: number
}

const STATUS_COLORS: Record<PartnerStatus, string> = {
  pending: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  suspended: 'bg-red-500/10 border-red-500/20 text-red-400',
}

const PRICING_LABELS: Record<PricingType, string> = {
  rev_share: 'Rev Share',
  wholesale: 'Wholesale',
  custom: 'Custom',
}

function emptyForm() {
  return {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    partner_code: '',
    pricing_type: 'rev_share' as PricingType,
    revenue_share_pct: '',
    wholesale_price: '',
    notes: '',
  }
}

export default function AdminPartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [creating, setCreating] = useState(false)

  // Expanded partner
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loadingMerchants, setLoadingMerchants] = useState(false)

  // Edit partner
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Partner>>({})
  const [saving, setSaving] = useState(false)

  // Assign merchant
  const [showAssign, setShowAssign] = useState(false)
  const [allMerchants, setAllMerchants] = useState<AllMerchant[]>([])
  const [assignSearch, setAssignSearch] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)

  // Create login
  const [loginEmail, setLoginEmail] = useState('')
  const [creatingLogin, setCreatingLogin] = useState(false)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/admin/partners')
      .then((r) => {
        if (r.status === 403 || r.status === 401) { router.push('/'); return null }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setPartners(d.partners ?? [])
        setStats(d.stats ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  useEffect(() => { load() }, [load])

  async function createPartner() {
    setCreating(true)
    setError(null)
    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        revenue_share_pct: form.revenue_share_pct ? parseFloat(form.revenue_share_pct) : null,
        wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setShowCreate(false)
      setForm(emptyForm())
      load()
    } else {
      setError(data.error ?? 'Failed to create partner')
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setEditingId(null)
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p))
    } else {
      setError(data.error ?? 'Failed to save')
    }
  }

  async function updateStatus(id: string, status: PartnerStatus) {
    setError(null)
    const res = await fetch('/api/admin/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to update status')
    }
  }

  async function loadMerchants(partnerId: string) {
    setLoadingMerchants(true)
    const res = await fetch(`/api/admin/partners/${partnerId}/merchants`)
    const data = await res.json()
    setMerchants(Array.isArray(data) ? data : [])
    setLoadingMerchants(false)
  }

  function toggleExpand(partner: Partner) {
    if (expandedId === partner.id) {
      setExpandedId(null)
      setEditingId(null)
      setShowAssign(false)
      setLoginMessage(null)
    } else {
      setExpandedId(partner.id)
      setEditForm({
        name: partner.name,
        contact_name: partner.contact_name,
        email: partner.email,
        phone: partner.phone ?? '',
        partner_code: partner.partner_code,
        pricing_type: partner.pricing_type,
        revenue_share_pct: partner.revenue_share_pct,
        wholesale_price: partner.wholesale_price,
        notes: partner.notes ?? '',
      })
      setLoginEmail(partner.email)
      setLoginMessage(null)
      setShowAssign(false)
      loadMerchants(partner.id)
    }
  }

  async function loadAllMerchants() {
    const res = await fetch('/api/admin/accounts')
    const data = await res.json()
    setAllMerchants(data.accounts ?? [])
  }

  async function assignMerchant(partnerId: string, businessId: string) {
    setAssigning(businessId)
    const res = await fetch(`/api/admin/partners/${partnerId}/merchants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    })
    setAssigning(null)
    if (res.ok) {
      setAllMerchants((prev) => prev.map((m) => m.business_id === businessId ? { ...m, partner_id: partnerId } : m))
      loadMerchants(partnerId)
      load()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to assign merchant')
    }
  }

  async function unassignMerchant(partnerId: string, businessId: string) {
    setAssigning(businessId)
    await fetch(`/api/admin/partners/${partnerId}/merchants?business_id=${businessId}`, { method: 'DELETE' })
    setAssigning(null)
    setMerchants((prev) => prev.filter((m) => m.id !== businessId))
    load()
  }

  async function createLogin(partnerId: string) {
    setCreatingLogin(true)
    setLoginMessage(null)
    const res = await fetch(`/api/admin/partners/${partnerId}/create-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail }),
    })
    const data = await res.json()
    setCreatingLogin(false)
    if (res.ok) {
      setLoginMessage(data.message ?? 'Login created successfully')
    } else {
      setError(data.error ?? 'Failed to create login')
    }
  }

  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.partner_code.toLowerCase().includes(search.toLowerCase())
  )

  const unassignedMerchants = allMerchants.filter(
    (m) => !m.partner_id && m.bar_name.toLowerCase().includes(assignSearch.toLowerCase())
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
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.push('/admin')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Admin Panel
            </button>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Partner Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage reseller and MSP partnerships</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admin Only</span>
          </div>
          <button
            onClick={() => { setShowCreate(true); setError(null) }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-xl transition-colors"
          >
            + New Partner
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-300 hover:text-red-100">✕</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Partners', value: stats.total_partners, color: 'text-slate-100' },
            { label: 'Active Partners', value: stats.active_partners, color: 'text-emerald-400' },
            { label: 'Total Merchants', value: stats.total_merchants, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create partner modal */}
      {showCreate && (
        <div className="mb-6 bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-5">New Partner</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Company Name', key: 'name', placeholder: 'Acme MSP' },
              { label: 'Contact Name', key: 'contact_name', placeholder: 'Jane Smith' },
              { label: 'Email', key: 'email', placeholder: 'jane@acme.com', type: 'email' },
              { label: 'Phone', key: 'phone', placeholder: '+1 555 000 0000' },
              { label: 'Partner Code', key: 'partner_code', placeholder: 'ACME-001' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                <input
                  type={type ?? 'text'}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pricing Type</label>
              <select
                value={form.pricing_type}
                onChange={(e) => setForm((f) => ({ ...f, pricing_type: e.target.value as PricingType }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
              >
                <option value="rev_share">Revenue Share</option>
                <option value="wholesale">Wholesale</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {form.pricing_type === 'rev_share' && (
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Revenue Share %</label>
                <input
                  type="number"
                  value={form.revenue_share_pct}
                  onChange={(e) => setForm((f) => ({ ...f, revenue_share_pct: e.target.value }))}
                  placeholder="20"
                  min="0" max="100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            )}
            {form.pricing_type === 'wholesale' && (
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Wholesale Price / Merchant</label>
                <input
                  type="number"
                  value={form.wholesale_price}
                  onChange={(e) => setForm((f) => ({ ...f, wholesale_price: e.target.value }))}
                  placeholder="49"
                  min="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes about this partnership…"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={createPartner}
              disabled={creating}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create Partner'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setError(null) }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search partners by name, email, or partner code…"
          className="w-full bg-slate-900 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
        />
      </div>

      {/* Partners table */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Partner', 'Code', 'Contact', 'Pricing', 'Merchants', 'MRR', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-600 text-sm">
                    {partners.length === 0 ? 'No partners yet. Create your first partner above.' : 'No partners match your search.'}
                  </td>
                </tr>
              )}
              {filtered.map((partner) => (
                <React.Fragment key={partner.id}>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-100">{partner.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{partner.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{partner.partner_code}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      <p className="text-slate-300">{partner.contact_name}</p>
                      {partner.phone && <p className="text-slate-500">{partner.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      <p>{PRICING_LABELS[partner.pricing_type]}</p>
                      {partner.pricing_type === 'rev_share' && partner.revenue_share_pct && (
                        <p className="text-slate-500">{partner.revenue_share_pct}%</p>
                      )}
                      {partner.pricing_type === 'wholesale' && partner.wholesale_price && (
                        <p className="text-slate-500">${partner.wholesale_price}/mo</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <p className="text-slate-100 font-semibold">{partner.active_merchant_count}</p>
                      <p className="text-xs text-slate-500">of {partner.merchant_count}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs">
                      ${partner.mrr.toLocaleString()}/mo
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_COLORS[partner.status]}`}>
                        {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(partner)}
                          className="text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        >
                          {expandedId === partner.id ? 'Close' : 'Manage'}
                        </button>
                        {partner.status === 'active' ? (
                          <button
                            onClick={() => updateStatus(partner.id, 'suspended')}
                            className="text-xs px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                          >
                            Suspend
                          </button>
                        ) : partner.status === 'suspended' ? (
                          <button
                            onClick={() => updateStatus(partner.id, 'active')}
                            className="text-xs px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus(partner.id, 'active')}
                            className="text-xs px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === partner.id && (
                    <tr>
                      <td colSpan={8} className="bg-slate-800/40 px-5 py-6">
                        <div className="grid grid-cols-3 gap-6">

                          {/* Edit partner details */}
                          <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Partner Details</h3>
                            {editingId === partner.id ? (
                              <div className="space-y-3">
                                {[
                                  { label: 'Company Name', key: 'name' },
                                  { label: 'Contact Name', key: 'contact_name' },
                                  { label: 'Email', key: 'email' },
                                  { label: 'Phone', key: 'phone' },
                                  { label: 'Partner Code', key: 'partner_code' },
                                ].map(({ label, key }) => (
                                  <div key={key}>
                                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</label>
                                    <input
                                      type="text"
                                      value={String((editForm as Record<string, unknown>)[key] ?? '')}
                                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    />
                                  </div>
                                ))}
                                <div>
                                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Pricing Type</label>
                                  <select
                                    value={editForm.pricing_type ?? 'rev_share'}
                                    onChange={(e) => setEditForm((f) => ({ ...f, pricing_type: e.target.value as PricingType }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                                  >
                                    <option value="rev_share">Revenue Share</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                </div>
                                {editForm.pricing_type === 'rev_share' && (
                                  <div>
                                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Rev Share %</label>
                                    <input
                                      type="number"
                                      value={editForm.revenue_share_pct ?? ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, revenue_share_pct: parseFloat(e.target.value) || null }))}
                                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    />
                                  </div>
                                )}
                                {editForm.pricing_type === 'wholesale' && (
                                  <div>
                                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Wholesale Price / Merchant</label>
                                    <input
                                      type="number"
                                      value={editForm.wholesale_price ?? ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, wholesale_price: parseFloat(e.target.value) || null }))}
                                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Notes</label>
                                  <textarea
                                    value={String(editForm.notes ?? '')}
                                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(partner.id)}
                                    disabled={saving}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {saving ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 text-sm">
                                {[
                                  ['Contact', partner.contact_name],
                                  ['Email', partner.email],
                                  ['Phone', partner.phone ?? '—'],
                                  ['Pricing', PRICING_LABELS[partner.pricing_type]],
                                  ['Rev Share', partner.revenue_share_pct ? `${partner.revenue_share_pct}%` : '—'],
                                  ['Wholesale', partner.wholesale_price ? `$${partner.wholesale_price}/mo` : '—'],
                                  ['Notes', partner.notes ?? '—'],
                                  ['Created', new Date(partner.created_at).toLocaleDateString()],
                                ].map(([label, val]) => (
                                  <div key={label} className="flex gap-2">
                                    <span className="text-slate-500 text-xs w-24 shrink-0">{label}</span>
                                    <span className="text-slate-300 text-xs">{val}</span>
                                  </div>
                                ))}
                                <button
                                  onClick={() => setEditingId(partner.id)}
                                  className="mt-2 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                                >
                                  Edit Details
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Merchants under this partner */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Merchants ({merchants.length})</h3>
                              <button
                                onClick={() => {
                                  setShowAssign(!showAssign)
                                  if (!showAssign) { loadAllMerchants(); setAssignSearch('') }
                                }}
                                className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                              >
                                + Assign
                              </button>
                            </div>

                            {showAssign && (
                              <div className="mb-3 bg-slate-900 border border-slate-700 rounded-xl p-3">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Assign Unlinked Merchant</p>
                                <input
                                  type="text"
                                  value={assignSearch}
                                  onChange={(e) => setAssignSearch(e.target.value)}
                                  placeholder="Search merchants…"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 mb-2"
                                />
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {unassignedMerchants.slice(0, 20).map((m) => (
                                    <div key={m.business_id} className="flex items-center justify-between py-0.5">
                                      <span className="text-xs text-slate-300">{m.bar_name}</span>
                                      <button
                                        onClick={() => assignMerchant(partner.id, m.business_id)}
                                        disabled={assigning === m.business_id}
                                        className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded transition-colors disabled:opacity-50"
                                      >
                                        {assigning === m.business_id ? '…' : 'Assign'}
                                      </button>
                                    </div>
                                  ))}
                                  {unassignedMerchants.length === 0 && (
                                    <p className="text-xs text-slate-600">No unassigned merchants</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {loadingMerchants ? (
                              <p className="text-xs text-slate-500">Loading…</p>
                            ) : merchants.length === 0 ? (
                              <p className="text-xs text-slate-600">No merchants assigned yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {merchants.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                                    <div>
                                      <p className="text-xs text-slate-200">{m.name}</p>
                                      <p className="text-[10px] text-slate-500">
                                        {m.plan} · {new Date(m.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.stripe_subscription_id ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-700'}`}>
                                        {m.stripe_subscription_id ? 'Active' : 'Trial'}
                                      </span>
                                      <button
                                        onClick={() => unassignMerchant(partner.id, m.id)}
                                        disabled={assigning === m.id}
                                        className="text-[10px] text-slate-600 hover:text-red-400 transition-colors"
                                      >
                                        {assigning === m.id ? '…' : '✕'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Partner login */}
                          <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Partner Login Access</h3>
                            <p className="text-xs text-slate-500 mb-3">
                              Create login credentials so this partner can access their dashboard. They&apos;ll receive a password setup email.
                            </p>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Login Email</label>
                                <input
                                  type="email"
                                  value={loginEmail}
                                  onChange={(e) => setLoginEmail(e.target.value)}
                                  placeholder="partner@company.com"
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                              </div>
                              <button
                                onClick={() => createLogin(partner.id)}
                                disabled={creatingLogin || !loginEmail}
                                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {creatingLogin ? 'Creating…' : 'Create / Resend Login'}
                              </button>
                              {loginMessage && (
                                <p className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">{loginMessage}</p>
                              )}
                            </div>

                            {/* Quick stats */}
                            <div className="mt-4 pt-4 border-t border-slate-700/60">
                              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Revenue Summary</h3>
                              <div className="space-y-1.5">
                                {[
                                  ['Total Merchants', partner.merchant_count],
                                  ['Active (Paying)', partner.active_merchant_count],
                                  ['Merchant MRR', `$${partner.mrr.toLocaleString()}/mo`],
                                ].map(([label, val]) => (
                                  <div key={String(label)} className="flex justify-between">
                                    <span className="text-xs text-slate-500">{label}</span>
                                    <span className="text-xs text-slate-300 font-medium">{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
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
        {filtered.length} of {partners.length} partners
      </p>
    </div>
  )
}
