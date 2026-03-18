'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const sections = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '▣' },
    ],
  },
  {
    label: 'Bartender',
    items: [
      { href: '/drink-library', label: 'Drink Library', icon: '◍' },
    ],
  },
  {
    label: 'Manager',
    items: [
      { href: '/stock', label: 'Stock Levels', icon: '◫' },
      { href: '/sales', label: 'Sales Log', icon: '◎' },
      { href: '/uploads', label: 'Import Reports', icon: '⇪' },
      { href: '/purchase-scan', label: 'Purchase Scan', icon: '⊡' },
      { href: '/profit-intelligence', label: 'Profit Intelligence', icon: '◑' },
      { href: '/variance-reports', label: 'Loss Reports', icon: '◐' },
      { href: '/reorder', label: 'Smart Reorder', icon: '⟳' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { href: '/inventory-items', label: 'Inventory Items', icon: '◈' },
      { href: '/menu-items', label: 'Recipe Mapping', icon: '◉' },
      { href: '/vendors', label: 'Vendors', icon: '◷' },
      { href: '/connections', label: 'POS Connections', icon: '⇋' },
      { href: '/profile', label: 'Account Settings', icon: '◎' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [businessName, setBusinessName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.business_name) setBusinessName(d.business_name) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

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
      <nav className="flex-1 px-3 py-4 space-y-0 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-4 pt-4 border-t border-slate-800/50' : ''}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[9px] font-semibold text-slate-700 uppercase tracking-[0.15em]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800/60 space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-xs text-slate-500 truncate">{businessName ?? '…'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-colors border border-transparent"
        >
          <span className="font-mono text-[10px]">⊗</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
