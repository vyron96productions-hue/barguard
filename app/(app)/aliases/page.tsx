'use client'

import { useEffect, useState } from 'react'
import type { InventoryItem, MenuItem } from '@/types'

interface UnmatchedData {
  menu_names: string[]
  inventory_names: string[]
}

export default function AliasesPage() {
  const [unmatched, setUnmatched] = useState<UnmatchedData>({ menu_names: [], inventory_names: [] })
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [u, menu, inv] = await Promise.all([
      fetch('/api/aliases/unmatched').then((r) => r.json()),
      fetch('/api/menu-items').then((r) => r.json()),
      fetch('/api/inventory-items').then((r) => r.json()),
    ])
    setUnmatched(u)
    setMenuItems(Array.isArray(menu) ? menu : [])
    setInventoryItems(Array.isArray(inv) ? inv : [])
    setLoading(false)
  }

  async function resolve(type: 'menu' | 'inventory', rawName: string, targetId: string) {
    if (!targetId) return
    setSaving(rawName)
    const res = await fetch('/api/aliases/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, raw_name: rawName, target_id: targetId }),
    })
    if (res.ok) {
      setResolved((prev) => new Set([...prev, rawName]))
    }
    setSaving(null)
  }

  const totalUnresolved = unmatched.menu_names.length + unmatched.inventory_names.length - resolved.size

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Alias Resolution</h1>
        <p className="text-gray-500 mt-1 text-sm">Map raw CSV names to your normalized items so calculations work correctly.</p>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : totalUnresolved === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">✅</p>
          <p>All item names are resolved. Great work.</p>
        </div>
      ) : (
        <>
          {unmatched.menu_names.filter((n) => !resolved.has(n)).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-gray-100 text-sm sm:text-base">Unmatched Menu Names</h2>
                <p className="text-xs text-gray-500 mt-1">From your sales CSV — no matching menu item found.</p>
              </div>
              <div className="divide-y divide-gray-800">
                {unmatched.menu_names.filter((n) => !resolved.has(n)).map((rawName) => (
                  <AliasRow
                    key={rawName}
                    rawName={rawName}
                    options={menuItems.map((m) => ({ id: m.id, label: m.name }))}
                    saving={saving === rawName}
                    onResolve={(targetId) => resolve('menu', rawName, targetId)}
                  />
                ))}
              </div>
            </div>
          )}

          {unmatched.inventory_names.filter((n) => !resolved.has(n)).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-gray-100 text-sm sm:text-base">Unmatched Inventory Names</h2>
                <p className="text-xs text-gray-500 mt-1">From your inventory or purchase CSV — no matching inventory item found.</p>
              </div>
              <div className="divide-y divide-gray-800">
                {unmatched.inventory_names.filter((n) => !resolved.has(n)).map((rawName) => (
                  <AliasRow
                    key={rawName}
                    rawName={rawName}
                    options={inventoryItems.map((i) => ({ id: i.id, label: i.name }))}
                    saving={saving === rawName}
                    onResolve={(targetId) => resolve('inventory', rawName, targetId)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AliasRow({
  rawName,
  options,
  saving,
  onResolve,
}: {
  rawName: string
  options: { id: string; label: string }[]
  saving: boolean
  onResolve: (targetId: string) => void
}) {
  const [selected, setSelected] = useState('')
  return (
    <div className="px-4 sm:px-5 py-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
      {/* Raw name */}
      <code className="block w-full sm:flex-1 text-sm text-yellow-300 bg-gray-800 px-2.5 py-2 rounded break-all">
        {rawName}
      </code>

      <span className="hidden sm:block text-gray-600 text-sm shrink-0">→</span>

      {/* Select + Save row */}
      <div className="flex gap-2 sm:contents">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 sm:flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
        >
          <option value="">Select match…</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button
          onClick={() => onResolve(selected)}
          disabled={!selected || saving}
          className="shrink-0 px-4 py-2 bg-amber-500 text-gray-900 font-medium rounded text-sm hover:bg-amber-400 active:bg-amber-300 disabled:opacity-40 transition-colors min-w-[64px]"
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
