'use client'

import { useEffect, useState, useCallback } from 'react'

const COMMON_UNITS = [
  'oz', 'ml', 'cl',
  'each', 'piece', 'slice', 'strip', 'portion', 'serving',
  'lb', 'g', 'cup', 'tbsp', 'tsp',
]

interface ModifierRule {
  id: string
  modifier_name: string
  action: 'add' | 'remove' | 'multiply' | 'ignore'
  inventory_item_id: string | null
  qty_delta: number | null
  qty_unit: string | null
  multiply_factor: number | null
  notes: string | null
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  category: string | null
}

const ACTION_LABELS: Record<string, string> = {
  ignore:   'No recipe change',
  remove:   'Remove ingredient',
  add:      'Add ingredient',
  multiply: 'Multiply recipe',
}

const ACTION_COLORS: Record<string, string> = {
  ignore:   '#475569',
  remove:   '#ef4444',
  add:      '#22c55e',
  multiply: '#f59e0b',
}

interface RowState {
  action: 'add' | 'remove' | 'multiply' | 'ignore'
  inventory_item_id: string
  qty_delta: string
  qty_unit: string
  multiply_factor: string
  notes: string
  dirty: boolean
  saving: boolean
}

export default function ModifierRulesPage() {
  const [rules, setRules] = useState<ModifierRule[]>([])
  const [seenModifiers, setSeenModifiers] = useState<string[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rowState, setRowState] = useState<Record<string, RowState>>({})
  const [newModifierName, setNewModifierName] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [rulesRes, invRes] = await Promise.all([
      fetch('/api/modifier-rules'),
      fetch('/api/inventory-items'),
    ])
    const rulesData = await rulesRes.json()
    const invData = await invRes.json()
    setRules(rulesData.rules ?? [])
    setSeenModifiers(rulesData.seenModifiers ?? [])
    setInventoryItems(invData.items ?? invData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Merge seen + existing rules into display rows
  const allModifierNames = Array.from(new Set([
    ...seenModifiers,
    ...rules.map((r) => r.modifier_name),
  ])).sort()

  function getRuleForName(name: string): ModifierRule | undefined {
    return rules.find((r) => r.modifier_name.toLowerCase() === name.toLowerCase())
  }

  function getRowState(name: string): RowState {
    if (rowState[name]) return rowState[name]
    const rule = getRuleForName(name)
    const selectedItem = inventoryItems.find((i) => i.id === rule?.inventory_item_id)
    return {
      action: rule?.action ?? 'ignore',
      inventory_item_id: rule?.inventory_item_id ?? '',
      qty_delta: rule?.qty_delta != null ? String(rule.qty_delta) : '',
      qty_unit: rule?.qty_unit ?? selectedItem?.unit ?? 'oz',
      multiply_factor: rule?.multiply_factor != null ? String(rule.multiply_factor) : '2',
      notes: rule?.notes ?? '',
      dirty: false,
      saving: false,
    }
  }

  function updateRow(name: string, patch: Partial<RowState>) {
    setRowState((prev) => ({
      ...prev,
      [name]: { ...getRowState(name), ...patch, dirty: true },
    }))
  }

  async function saveRow(name: string) {
    const state = getRowState(name)
    setRowState((prev) => ({ ...prev, [name]: { ...state, saving: true } }))
    setError(null)

    const body: Record<string, unknown> = {
      modifier_name: name,
      action: state.action,
      inventory_item_id: ['add', 'remove'].includes(state.action) ? (state.inventory_item_id || null) : null,
      qty_delta: ['add', 'remove'].includes(state.action) && state.qty_delta ? parseFloat(state.qty_delta) : null,
      qty_unit: ['add', 'remove'].includes(state.action) ? (state.qty_unit || 'oz') : null,
      multiply_factor: state.action === 'multiply' && state.multiply_factor ? parseFloat(state.multiply_factor) : null,
      notes: state.notes || null,
    }

    const res = await fetch('/api/modifier-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
      setRowState((prev) => ({ ...prev, [name]: { ...state, saving: false } }))
      return
    }
    await load()
    setRowState((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  async function deleteRule(id: string, name: string) {
    setRowState((prev) => ({ ...prev, [name]: { ...getRowState(name), saving: true } }))
    await fetch('/api/modifier-rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
    setRowState((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  async function addNewRule() {
    if (!newModifierName.trim()) return
    setAddingNew(false)
    const name = newModifierName.trim()
    setNewModifierName('')
    setRowState((prev) => ({
      ...prev,
      [name]: { action: 'ignore', inventory_item_id: '', qty_delta: '', multiply_factor: '2', notes: '', dirty: true, saving: false },
    }))
    // Scroll to new row (just re-render is enough since it'll appear in the list)
    setSeenModifiers((prev) => Array.from(new Set([...prev, name])).sort())
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100 mb-1">Modifier Rules</h1>
        <p className="text-sm text-slate-500">
          Define how POS modifiers affect ingredient deductions in your variance reports.
          Modifiers seen in your sales appear automatically — map them once and BarGuard adjusts the expected usage forever.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(ACTION_LABELS).map(([action, label]) => (
          <div key={action} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: ACTION_COLORS[action] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Add new rule button */}
      <div className="mb-4">
        {!addingNew ? (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 border border-dashed border-slate-700 rounded-lg hover:border-amber-500/40 hover:text-amber-400 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add modifier rule manually
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newModifierName}
              onChange={(e) => setNewModifierName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addNewRule(); if (e.key === 'Escape') setAddingNew(false) }}
              placeholder="Modifier name (e.g. No Bacon)"
              className="flex-1 max-w-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
            />
            <button onClick={addNewRule} className="px-3 py-2 bg-amber-500 text-slate-900 text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">Add</button>
            <button onClick={() => setAddingNew(false)} className="px-3 py-2 text-slate-500 text-sm hover:text-slate-300">Cancel</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-600 text-sm">Loading...</div>
      ) : allModifierNames.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-500 text-sm mb-2">No modifiers found yet.</p>
          <p className="text-slate-600 text-xs">Once you sync sales from Square or Clover, any modifiers on orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allModifierNames.map((name) => {
            const existingRule = getRuleForName(name)
            const state = getRowState(name)
            const isFromSales = seenModifiers.includes(name)

            return (
              <div
                key={name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                {/* Top row: name + badge */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACTION_COLORS[state.action] }} />
                  <span className="text-sm font-medium text-slate-200 flex-1">{name}</span>
                  {isFromSales && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 border border-slate-800 px-2 py-0.5 rounded-full">
                      seen in sales
                    </span>
                  )}
                  {existingRule && !state.dirty && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: ACTION_COLORS[existingRule.action], borderColor: ACTION_COLORS[existingRule.action] + '40' }}>
                      {ACTION_LABELS[existingRule.action]}
                    </span>
                  )}
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Action dropdown */}
                  <select
                    value={state.action}
                    onChange={(e) => updateRow(name, { action: e.target.value as RowState['action'] })}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="ignore">No recipe change</option>
                    <option value="remove">Remove ingredient</option>
                    <option value="add">Add ingredient</option>
                    <option value="multiply">Multiply recipe</option>
                  </select>

                  {/* Remove/Add: inventory item + oz */}
                  {(state.action === 'remove' || state.action === 'add') && (
                    <>
                      <select
                        value={state.inventory_item_id}
                        onChange={(e) => {
                          const item = inventoryItems.find((i) => i.id === e.target.value)
                          updateRow(name, {
                            inventory_item_id: e.target.value,
                            // Auto-set unit to match the inventory item's unit
                            qty_unit: item?.unit ?? state.qty_unit ?? 'oz',
                          })
                        }}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 max-w-[220px]"
                      >
                        <option value="">— select ingredient —</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={state.qty_delta}
                          onChange={(e) => updateRow(name, { qty_delta: e.target.value })}
                          placeholder="0.0"
                          className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                        />
                        <select
                          value={state.qty_unit}
                          onChange={(e) => updateRow(name, { qty_unit: e.target.value })}
                          className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Multiply: factor */}
                  {state.action === 'multiply' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">×</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={state.multiply_factor}
                        onChange={(e) => updateRow(name, { multiply_factor: e.target.value })}
                        placeholder="2"
                        className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                      />
                      <span className="text-xs text-slate-600">all ingredients</span>
                    </div>
                  )}

                  {/* Save + delete */}
                  <div className="flex items-center gap-2 ml-auto">
                    {state.dirty && (
                      <button
                        onClick={() => saveRow(name)}
                        disabled={state.saving}
                        className="px-3 py-1.5 bg-amber-500 text-slate-900 text-xs font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
                      >
                        {state.saving ? 'Saving…' : 'Save'}
                      </button>
                    )}
                    {existingRule && !state.dirty && (
                      <button
                        onClick={() => deleteRule(existingRule.id, name)}
                        disabled={state.saving}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove rule
                      </button>
                    )}
                    {state.dirty && !state.saving && (
                      <button
                        onClick={() => setRowState((prev) => { const n = { ...prev }; delete n[name]; return n })}
                        className="text-xs text-slate-600 hover:text-slate-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Helper text */}
                {state.action === 'remove' && state.inventory_item_id && state.qty_delta && (
                  <p className="mt-2 text-[11px] text-slate-600">
                    When &quot;{name}&quot; is applied, BarGuard will expect <span className="text-slate-500">{state.qty_delta} {state.qty_unit} less</span> of the selected ingredient per sale.
                  </p>
                )}
                {state.action === 'add' && state.inventory_item_id && state.qty_delta && (
                  <p className="mt-2 text-[11px] text-slate-600">
                    When &quot;{name}&quot; is applied, BarGuard will expect <span className="text-slate-500">{state.qty_delta} {state.qty_unit} more</span> of the selected ingredient per sale.
                  </p>
                )}
                {state.action === 'multiply' && state.multiply_factor && (
                  <p className="mt-2 text-[11px] text-slate-600">
                    When &quot;{name}&quot; is applied, BarGuard will expect <span className="text-slate-500">{state.multiply_factor}× all base recipe ingredients</span> per sale.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">How modifier rules work</p>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li><span className="text-slate-500">No recipe change</span> — modifier is ignored, base recipe runs as normal (e.g. &quot;no ice&quot;, &quot;extra napkins&quot;)</li>
          <li><span className="text-red-400">Remove ingredient</span> — subtracts the oz amount from expected usage for that item (e.g. &quot;no bacon&quot; = remove 1 strip / 0.5 oz)</li>
          <li><span className="text-green-400">Add ingredient</span> — adds oz to expected usage (e.g. &quot;extra shot&quot; = add 1.0 oz vodka)</li>
          <li><span className="text-amber-400">Multiply recipe</span> — scales all ingredients by a factor (e.g. &quot;double&quot; = 2× everything in the base recipe)</li>
        </ul>
      </div>
    </div>
  )
}
