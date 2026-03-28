'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useBusinessContext } from '@/app/(app)/BusinessContext'
import { NAV_SECTIONS } from '@/lib/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { businessName, isAdmin } = useBusinessContext()

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
          <img src="/barguard_icon.png" alt="BarGuard" className="h-12 w-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-none">BarGuard</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-wide uppercase">Loss Detection</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
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

      {/* Admin section — only visible to admins */}
      {isAdmin && (
        <div className="px-3 pb-2 border-t border-slate-800/60 pt-3">
          <p className="px-3 mb-1.5 text-[9px] font-semibold text-red-700 uppercase tracking-[0.15em]">Admin</p>
          <div className="space-y-0.5">
            {[
              { href: '/admin', label: 'Accounts' },
              { href: '/admin/partners', label: 'Partners' },
            ].map((item) => {
              const active = pathname.startsWith(item.href) && (item.href === '/admin' ? pathname === '/admin' : true)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
                    active
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span className={`text-xs font-mono ${active ? 'text-red-400' : 'text-slate-700 group-hover:text-slate-500'}`}>⬡</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

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
