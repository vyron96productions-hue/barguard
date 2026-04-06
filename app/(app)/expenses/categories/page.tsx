'use client'

import { useState, useEffect } from 'react'
import type { ExpenseCategory } from '@/types'

const GROUPS = ['Operations', 'Admin', 'Facilities', 'Other']

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading]       = useState(true)
  const [newName, setNewName]       = useState('')
  const [newGroup, setNewGroup]     = useState('Other')
  const [adding, setAdding]         = useState(false)
  const [addError, setAddError]     = useState<string | null>(null)
  const [editing, setEditing]       = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [editGroup, setEditGroup]   = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)

  async function load() {
    const res  = await fetch('/api/expense-categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setAddError(null)
    const res = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_group: newGroup }),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error); setAdding(false); return }
    setNewName('')
    setNewGroup('Other')
    await load()
    setAdding(false)
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/expense-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), parent_group: editGroup }),
    })
    if (res.ok) { setEditing(null); await load() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Items using it will become uncategorized.')) return
    setDeleting(id)
    await fetch(`/api/expense-categories/${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  const system = categories.filter((c) => c.is_system)
  const custom  = categories.filter((c) => !c.is_system)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Expense Categories</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage how operating expenses are classified</p>
      </div>

      {/* Add custom */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Add Custom Category</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Category name"
            className="flex-1 min-w-40 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addError && <p className="text-xs text-red-400">{addError}</p>}
      </div>

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      ) : (
        <>
          {/* Custom */}
          {custom.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Custom Categories</p>
              </div>
              <div className="divide-y divide-slate-800">
                {custom.map((c) => (
                  <div key={c.id} className="px-5 py-3">
                    {editing === c.id ? (
                      <div className="flex gap-2 flex-wrap">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 min-w-32 bg-slate-800 border border-blue-500/40 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <select
                          value={editGroup}
                          onChange={(e) => setEditGroup(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none"
                        >
                          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <button onClick={() => handleEdit(c.id)} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Save</button>
                        <button onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                          {c.parent_group && (
                            <span className="ml-2 text-xs text-slate-500">{c.parent_group}</span>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setEditing(c.id); setEditName(c.name); setEditGroup(c.parent_group ?? 'Other') }}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                            className="text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deleting === c.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">System Categories</p>
            </div>
            <div className="divide-y divide-slate-800">
              {system.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{c.name}</span>
                  <div className="flex items-center gap-2">
                    {c.parent_group && <span className="text-xs text-slate-600">{c.parent_group}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-500 font-medium">System</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
