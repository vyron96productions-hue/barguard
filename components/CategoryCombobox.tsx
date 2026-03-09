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
  placeholder = 'Select or create category…',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onMousedown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMousedown)
    return () => document.removeEventListener('mousedown', onMousedown)
  }, [])

  function openDropdown() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  function select(cat: string) {
    onChange(cat)
    setOpen(false)
    setQuery('')
  }

  const filtered = query
    ? categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : categories

  const canCreate =
    query.trim().length > 0 &&
    !categories.some((c) => c.toLowerCase() === query.trim().toLowerCase())

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={openDropdown}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:border-amber-500/60 transition-colors hover:border-gray-600"
      >
        <span className={value ? 'text-gray-200' : 'text-gray-600'}>{value || placeholder}</span>
        <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type new category…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setOpen(false); setQuery('') }
                if (e.key === 'Enter' && canCreate) { e.preventDefault(); select(query.trim()) }
              }}
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-3 text-xs text-gray-600 text-center">No categories yet</p>
            )}
            {filtered.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => select(cat)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  value === cat
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={() => select(query.trim())}
                className="w-full text-left px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 border-t border-gray-800 flex items-center gap-2"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>Create <strong>"{query.trim()}"</strong></span>
              </button>
            )}
          </div>

          {value && (
            <div className="border-t border-gray-800 px-2 py-1.5">
              <button
                type="button"
                onClick={() => select('')}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
