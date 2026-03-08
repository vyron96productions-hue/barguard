'use client'

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
  { href: '/aliases', label: 'Name Matching', icon: '⇌' },
  { href: '/variance-reports', label: 'Loss Reports', icon: '◐' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex w-56 bg-slate-950 border-r border-slate-800/60 flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900 font-black text-xs">BG</div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-none">BarGuard</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-wide uppercase">Loss Detection</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className={`text-xs font-mono ${active ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
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
    </aside>
  )
}
