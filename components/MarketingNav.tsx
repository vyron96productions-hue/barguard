'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .mnav-links { display: flex; align-items: center; gap: 8px; }
        .mnav-hamburger { display: none; }
        @media (max-width: 640px) {
          .mnav-links .mnav-text-link { display: none; }
          .mnav-hamburger { display: flex; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        backgroundColor: 'rgba(2,8,23,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/barguard_icon.png" alt="BarGuard" style={{ height: 56, width: 'auto', display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', letterSpacing: '-0.3px' }}>BarGuard</span>
          </Link>

          <div className="mnav-links">
            <Link href="/features" className="mnav-text-link" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Features</Link>
            <Link href="/pricing" className="mnav-text-link" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Pricing</Link>
            <Link href="/about" className="mnav-text-link" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Why BarGuard</Link>
            <Link href="/login" className="mnav-text-link" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Sign in</Link>
            <Link href="/signup" className="btn-primary" style={{ fontSize: 14, padding: '8px 18px', borderRadius: 8 }}>Get Started Free</Link>

            {/* Hamburger — mobile only */}
            <button
              className="mnav-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: '#94a3b8', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 22 22" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M3 6h16M3 11h16M3 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          {/* Menu panel */}
          <div style={{
            position: 'relative', zIndex: 1,
            backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
            padding: '20px 24px 28px',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/barguard_icon.png" alt="BarGuard" style={{ height: 52, width: 'auto' }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>BarGuard</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 8 }}
                aria-label="Close menu"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 4l12 12M16 4L4 16" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href="/features" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#94a3b8', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, display: 'block' }}>
                Features
              </Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#94a3b8', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, display: 'block' }}>
                Pricing
              </Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#94a3b8', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, display: 'block' }}>
                Why BarGuard
              </Link>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#94a3b8', textDecoration: 'none', padding: '12px 16px', borderRadius: 10, display: 'block' }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ fontSize: 16, padding: '13px 16px', borderRadius: 10, display: 'block', marginTop: 8, textAlign: 'center' as const, justifyContent: 'center' }}>
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
