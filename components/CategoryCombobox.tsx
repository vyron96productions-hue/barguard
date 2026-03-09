'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  categories: string[]
  placeholder?: string
  className?: string
}

export default function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = 'Select or create…',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close on outside pointer-down (works on touch too)
  useEffect(() => {
    function onPointerdown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerdown)
    return () => document.removeEventListener('pointerdown', onPointerdown)
  }, [])

  const filtered = query
    ? categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : categories

  const canCreate =
    query.trim().length > 0 &&
    !categories.some((c) => c.toLowerCase() === query.trim().toLowerCase())

  // Virtual list: existing matches + optional create entry
  const optionCount = filtered.length + (canCreate ? 1 : 0)

  function openDropdown() {
    setOpen(true)
    setQuery('')
    setActiveIdx(-1)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  function close() {
    setOpen(false)
    setQuery('')
    setActiveIdx(-1)
  }

  function select(cat: string) {
    onChange(cat)
    close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, optionCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && activeIdx < filtered.length) {
        select(filtered[activeIdx])
      } else if (activeIdx === filtered.length && canCreate) {
        select(query.trim())
      } else if (canCreate) {
        select(query.trim())
      }
    }
  }

  // Keep active option scrolled into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return
    const el = listRef.current.children[activeIdx] as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Closed: show value + clear × + chevron */}
      {!open ? (
        <button
          type="button"
          onClick={openDropdown}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 hover:border-gray-600 focus:outline-none focus:border-amber-500/60 transition-colors"
        >
          <span className={value ? 'text-gray-200' : 'text-gray-500 font-normal'}>{value || placeholder}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            {value && (
              <span
                role="button"
                aria-label="Clear"
                onPointerDown={(e) => { e.stopPropagation(); onChange('') }}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700 transition-colors text-base leading-none"
              >
                ×
              </span>
            )}
            <Chevron />
          </div>
        </button>
      ) : (
        /* Open: trigger becomes search input */
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1) }}
            onKeyDown={handleKeyDown}
            placeholder={value || placeholder}
            className="w-full bg-gray-800 border border-amber-500/60 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-200 placeholder-gray-500 focus:outline-none ring-1 ring-amber-500/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Chevron open />
          </div>
        </div>
      )}

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 min-w-[160px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div ref={listRef} className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-3 text-xs text-gray-600 text-center">
                {query ? 'No matches' : 'No categories yet — type to create one'}
              </p>
            )}

            {filtered.map((cat, i) => {
              const isActive = i === activeIdx
              const isSelected = value === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); select(cat) }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300'
                      : isSelected
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className={`w-3.5 text-center text-xs shrink-0 ${isSelected ? 'text-amber-400' : 'opacity-0'}`}>✓</span>
                  {cat}
                </button>
              )
            })}

            {canCreate && (
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); select(query.trim()) }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  activeIdx === filtered.length
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'text-amber-400 hover:bg-amber-500/10'
                } ${filtered.length > 0 ? 'border-t border-gray-800/80 mt-0.5 pt-2' : ''}`}
              >
                <span className="w-3.5 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold border border-current rounded px-0.5 leading-tight opacity-70">+</span>
                </span>
                <span>Create <strong className="font-semibold">"{query.trim()}"</strong></span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 12 12"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l4 4 4-4" />
    </svg>
  )
}
