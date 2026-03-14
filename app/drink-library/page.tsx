'use client'

import { useEffect, useState } from 'react'
import type { DrinkLibraryItem } from '@/types'

type IngredientRow = { ingredient_name: string; quantity_oz: string; notes: string }
const emptyIngredient = (): IngredientRow => ({ ingredient_name: '', quantity_oz: '', notes: '' })

const CATEGORIES = ['cocktail', 'shot', 'beer', 'wine', 'spirit', 'mocktail', 'other']

export default function DrinkLibraryPage() {
  const [allItems, setAllItems]   = useState<DrinkLibraryItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected]   = useState<DrinkLibraryItem | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  // Add drink modal
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState({
    name: '', category: 'cocktail', glassware: '', garnish: '', instructions: '', notes: '',
  })
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()])
  const [saving, setSaving]       = useState(false)
  const [addError, setAddError]   = useState('')

  // Import popular drinks
  const [seeding, setSeeding]     = useState(false)
  const [seedMsg, setSeedMsg]     = useState('')

  function loadDrinks(q = '') {
    fetch(`/api/drink-library${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : []
        setAllItems(items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadDrinks() }, [])

  useEffect(() => {
    const t = setTimeout(() => loadDrinks(search.trim()), 200)
    return () => clearTimeout(t)
  }, [search])

  const categories = ['all', ...Array.from(new Set(allItems.map((i) => i.category ?? 'other'))).sort()]
  const visible = categoryFilter === 'all'
    ? allItems
    : allItems.filter((i) => (i.category ?? 'other') === categoryFilter)

  function selectDrink(item: DrinkLibraryItem) {
    setSelected(item)
    setMobileView('detail')
  }

  function openAdd() {
    setAddForm({ name: '', category: 'cocktail', glassware: '', garnish: '', instructions: '', notes: '' })
    setIngredients([emptyIngredient()])
    setAddError('')
    setShowAdd(true)
  }

  function updateIngredient(index: number, field: keyof IngredientRow, value: string) {
    setIngredients((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, emptyIngredient()])
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!addForm.name.trim()) { setAddError('Drink name is required.'); return }
    setSaving(true)
    setAddError('')
    const validIngredients = ingredients.filter((i) => i.ingredient_name.trim() && i.quantity_oz)
    const res = await fetch('/api/drink-library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        ingredients: validIngredients.map((i) => ({
          ingredient_name: i.ingredient_name.trim(),
          quantity_oz: parseFloat(i.quantity_oz),
          notes: i.notes.trim() || undefined,
        })),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error ?? 'Failed to save.'); setSaving(false); return }
    setShowAdd(false)
    setSaving(false)
    loadDrinks(search.trim())
    setSelected(data)
    setMobileView('detail')
  }

  async function handleImport() {
    setSeeding(true)
    setSeedMsg('')
    const res = await fetch('/api/drink-library/seed', { method: 'POST' })
    const data = await res.json()
    setSeeding(false)
    if (!res.ok) { setSeedMsg('Import failed.'); return }
    setSeedMsg(`Added ${data.inserted} drinks${data.skipped ? ` (${data.skipped} already existed)` : ''}.`)
    loadDrinks(search.trim())
  }

  // ── Shared header buttons ──────────────────────────────────────────────────
  const HeaderButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleImport}
        disabled={seeding}
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-50"
      >
        {seeding ? 'Importing…' : 'Import Popular Drinks'}
      </button>
      <button
        onClick={openAdd}
        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
      >
        + Add Drink
      </button>
    </div>
  )

  // ── Mobile list view ──────────────────────────────────────────────────────
  const MobileList = (
    <div className="flex flex-col gap-0 md:hidden">
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Drink Library</h1>
            <p className="text-slate-500 text-xs mt-0.5">{allItems.length} drinks · tap to view recipe</p>
          </div>
          {HeaderButtons}
        </div>
        {seedMsg && <p className="text-xs text-emerald-400">{seedMsg}</p>}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drinks or nicknames…"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
        />
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? (
        <p className="text-slate-600 text-sm text-center py-12">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-slate-600 text-sm text-center py-12">No drinks found.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <button
              key={item.id}
              onClick={() => selectDrink(item)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 hover:border-slate-700 active:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5 capitalize">
                    {item.glassware ?? item.category ?? ''}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <span> · {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
                <span className="text-slate-700 shrink-0">›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const MobileDetail = selected && (
    <div className="md:hidden">
      <button
        onClick={() => setMobileView('list')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-5 transition-colors"
      >
        <span className="text-lg leading-none">‹</span>
        <span>All Drinks</span>
      </button>
      <DrinkDetail item={selected} />
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        {mobileView === 'list' ? MobileList : MobileDetail}
      </div>

      {/* Desktop split panel */}
      <div className="hidden md:flex gap-0 max-w-5xl -mx-8 lg:-mx-10 min-h-[80vh]">
        {/* Left: list panel */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 flex flex-col">
          <div className="px-5 pt-8 pb-4 border-b border-slate-800/40 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-base font-bold text-slate-100">Drink Library</h1>
                <p className="text-[11px] text-slate-600 mt-0.5">{allItems.length} drinks</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold uppercase tracking-wider shrink-0">
                Bartender
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={openAdd}
                className="flex-1 text-[11px] py-1.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
              >
                + Add Drink
              </button>
              <button
                onClick={handleImport}
                disabled={seeding}
                title="Import 40+ popular and rare cocktails"
                className="flex-1 text-[11px] py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 truncate px-1"
              >
                {seeding ? 'Importing…' : 'Import Drinks'}
              </button>
            </div>
            {seedMsg && <p className="text-[11px] text-emerald-400">{seedMsg}</p>}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drinks…"
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
            {categories.length > 1 && (
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-slate-600 text-xs px-5 py-6">Loading…</p>
            ) : visible.length === 0 ? (
              <p className="text-slate-600 text-xs px-5 py-6">No drinks found.</p>
            ) : (
              visible.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left px-5 py-3.5 border-b border-slate-800/40 transition-colors group ${
                    selected?.id === item.id
                      ? 'bg-amber-500/8 border-l-2 border-l-amber-500/70'
                      : 'hover:bg-slate-800/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <p className={`text-sm font-medium leading-snug ${selected?.id === item.id ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 capitalize">
                    {[item.glassware, item.ingredients?.length ? `${item.ingredients.length} ing.` : null]
                      .filter(Boolean).join(' · ')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {selected ? (
            <DrinkDetail item={selected} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-700 text-sm">Select a drink to view its recipe.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Drink Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Add Drink</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-600 hover:text-slate-300 text-xl leading-none">✕</button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {addError && <p className="text-sm text-red-400">{addError}</p>}

              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Margarita"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Glassware + Garnish */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Glassware</label>
                  <input
                    type="text"
                    value={addForm.glassware}
                    onChange={(e) => setAddForm((f) => ({ ...f, glassware: e.target.value }))}
                    placeholder="e.g. highball"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Garnish</label>
                  <input
                    type="text"
                    value={addForm.garnish}
                    onChange={(e) => setAddForm((f) => ({ ...f, garnish: e.target.value }))}
                    placeholder="e.g. lime wedge"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Ingredients</label>
                <div className="space-y-2">
                  {ingredients.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={row.ingredient_name}
                        onChange={(e) => updateIngredient(i, 'ingredient_name', e.target.value)}
                        placeholder="Ingredient name"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                      <input
                        type="number"
                        value={row.quantity_oz}
                        onChange={(e) => updateIngredient(i, 'quantity_oz', e.target.value)}
                        placeholder="oz"
                        min="0"
                        step="0.25"
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 text-center"
                      />
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => updateIngredient(i, 'notes', e.target.value)}
                        placeholder="Notes"
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                      {ingredients.length > 1 && (
                        <button onClick={() => removeIngredientRow(i)} className="text-slate-700 hover:text-red-400 text-lg leading-none shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addIngredientRow}
                  className="mt-2 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  + Add ingredient
                </button>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Instructions</label>
                <textarea
                  value={addForm.instructions}
                  onChange={(e) => setAddForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="How to make it…"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
                <input
                  type="text"
                  value={addForm.notes}
                  onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any tips, variations…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-sm hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Drink'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DrinkDetail({ item }: { item: DrinkLibraryItem }) {
  const totalCost = item.ingredients?.reduce((sum, ing) => {
    const cpo = ing.inventory_item?.cost_per_oz
    return sum + (cpo != null ? ing.quantity_oz * cpo : 0)
  }, 0) ?? 0
  const hasFullCost = (item.ingredients?.length ?? 0) > 0 &&
    item.ingredients!.every((ing) => ing.inventory_item?.cost_per_oz != null)

  return (
    <div className="space-y-7 max-w-lg">
      {/* Name + meta */}
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-slate-100 leading-tight">{item.name}</h2>
          {item.category && (
            <span className="mt-1.5 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 capitalize font-medium">
              {item.category}
            </span>
          )}
        </div>
        {item.aliases && item.aliases.length > 0 && (
          <p className="text-xs text-slate-600 mt-1.5">
            Also known as:{' '}
            <span className="text-slate-500">{item.aliases.map((a) => a.alias).join(', ')}</span>
          </p>
        )}
      </div>

      {/* Quick spec strip */}
      {(item.glassware || item.garnish) && (
        <div className="flex gap-2 flex-wrap">
          {item.glassware && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 text-xs">◻</span>
              <span className="text-xs text-slate-400 capitalize">{item.glassware}</span>
            </div>
          )}
          {item.garnish && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-600 text-xs">✦</span>
              <span className="text-xs text-slate-400">{item.garnish}</span>
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {item.ingredients && item.ingredients.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] mb-2">Ingredients</p>
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
            {item.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between px-4 py-3.5 bg-slate-900/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">{ing.ingredient_name}</p>
                  {ing.notes && <p className="text-xs text-slate-600 mt-0.5">{ing.notes}</p>}
                </div>
                <div className="text-right shrink-0 ml-6">
                  <p className="text-base font-bold text-amber-400 tabular-nums">{ing.quantity_oz}<span className="text-xs font-normal text-amber-400/60 ml-0.5">oz</span></p>
                  {ing.inventory_item?.cost_per_oz != null && (
                    <p className="text-[10px] text-slate-700 mt-0.5 tabular-nums">
                      ${(ing.quantity_oz * ing.inventory_item.cost_per_oz).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(hasFullCost || totalCost > 0) && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/30">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                  Est. cost{!hasFullCost ? ' (partial)' : ''}
                </p>
                <p className="text-xs font-semibold text-slate-500 tabular-nums">${totalCost.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {item.instructions && (
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] mb-2">Instructions</p>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-4">
            <p className="text-sm text-slate-400 leading-relaxed">{item.instructions}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] mb-2">Notes</p>
          <p className="text-sm text-slate-500 leading-relaxed">{item.notes}</p>
        </div>
      )}
    </div>
  )
}
