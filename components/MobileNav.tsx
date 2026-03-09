'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Dashboard', icon: '▣' },
  { href: '/connections', label: 'POS Connections', icon: '⇋' },
  { href: '/uploads', label: 'Import Reports', icon: '⇪' },
  { href: '/purchase-scan', label: 'Purchase Scan', icon: '⊡' },
  { href: '/stock', label: 'Stock Levels', icon: '◫' },
  { href: '/inventory-items', label: 'Inventory Items', icon: '◈' },
  { href: '/menu-items', label: 'Drink Recipes', icon: '◉' },
  { href: '/variance-reports', label: 'Loss Reports', icon: '◐' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Fixed mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h14M3 10h14M3 14h14" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-slate-900 font-black text-[10px]">BG</div>
          <span className="text-sm font-semibold text-slate-100">BarGuard</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">The Rusty Tap</span>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Slide-out drawer */}
          <div className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800/60 flex flex-col h-full shadow-2xl">
            {/* Drawer header */}
            <div className="px-5 py-5 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900 font-black text-xs">BG</div>
                <div>
                  <p className="text-sm font-semibold text-slate-100 leading-none">BarGuard</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-wide uppercase">Loss Detection</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors text-slate-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {nav.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-150 ${
                      active
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 active:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <span className={`text-xs font-mono ${active ? 'text-amber-400' : 'text-slate-600'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto w-1 h-4 rounded-full bg-amber-500 opacity-80" />}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-slate-500">The Rusty Tap</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
