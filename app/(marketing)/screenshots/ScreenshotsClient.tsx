'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// Each entry is one "slot" in the grid.
// If a feature has multiple screenshots, they appear as separate cards.
const SCREENSHOTS = [
  {
    file: 'Dashboard.png',
    label: 'Dashboard',
    description: 'At-a-glance KPIs — revenue, variance, top-loss items, and stock health in one view.',
  },
  {
    file: 'Dashboard2.png',
    label: 'Dashboard — Live Activity',
    description: 'Recent pours, active sessions, and real-time loss flags as they happen.',
  },
  {
    file: 'Dashboard3.png',
    label: 'Dashboard — Weekly Summary',
    description: 'Weekly breakdown of inventory movement, sales totals, and shrinkage by category.',
  },
  {
    file: 'StockLevels.png',
    label: 'Stock Levels',
    description: 'Live inventory counts by category. Spot what\'s low, what\'s missing, and what\'s off.',
  },
  {
    file: 'Stocklevels2.png',
    label: 'Stock Levels — Detail View',
    description: 'Drill down into individual items — on-hand quantity, par level, and last count date.',
  },
  {
    file: 'SalesLog.png',
    label: 'Sales Analytics',
    description: 'Revenue breakdown by drink, station, and category. Know what\'s actually selling.',
  },
  {
    file: 'SalesLogfood.png',
    label: 'Sales Analytics — Food',
    description: 'Food-only sales filtered by station, with cover counts and per-item contribution.',
  },
  {
    file: 'SaleslogBar1.png',
    label: 'Sales Analytics — Bar Station',
    description: 'Bar 1 sales in isolation — great for spotting station-level discrepancies.',
  },
  {
    file: 'SmartReorder.png',
    label: 'Smart Reorder',
    description: 'Auto-generated reorder list when items drop below your set par levels. One click to send to your vendor.',
  },
  {
    file: 'Profitintelligence.png',
    label: 'Profit Intelligence',
    description: 'Cost vs. sell price analysis. Find your most and least profitable items at a glance.',
  },
  {
    file: 'Profitintelligence2.png',
    label: 'Profit Intelligence — Margin View',
    description: 'Gross margin ranked from highest to lowest — instantly see where you should be pushing sales.',
  },
  {
    file: 'Profitintelligence3.png',
    label: 'Profit Intelligence — Cost Breakdown',
    description: 'Ingredient cost breakdown per drink so you know exactly where your margins are being eaten.',
  },
]

export default function ScreenshotsClient() {
  const [active, setActive] = useState<number | null>(null)

  const close = useCallback(() => setActive(null), [])
  const prev = useCallback(() => setActive(i => (i === null || i === 0) ? SCREENSHOTS.length - 1 : i - 1), [])
  const next = useCallback(() => setActive(i => (i === null || i === SCREENSHOTS.length - 1) ? 0 : i + 1), [])

  useEffect(() => {
    if (active === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, close, prev, next])

  useEffect(() => {
    document.body.style.overflow = active !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [active])

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <style>{`
        .ss-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .ss-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .ss-card:hover {
          transform: translateY(-5px);
          border-color: rgba(245,158,11,0.4);
          box-shadow: 0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.12);
        }
        .ss-card:hover .ss-overlay { opacity: 1; }
        .ss-img-wrap {
          position: relative;
          aspect-ratio: 16 / 10;
          background: #0a1628;
          overflow: hidden;
        }
        .ss-overlay {
          position: absolute; inset: 0;
          background: rgba(245,158,11,0.07);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .ss-expand {
          width: 44px; height: 44px;
          background: rgba(245,158,11,0.15);
          border: 1px solid rgba(245,158,11,0.4);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #f59e0b;
        }
        .lb-btn {
          background: rgba(15,23,42,0.9);
          border: 1px solid #1e293b;
          color: #94a3b8;
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .lb-btn:hover {
          background: rgba(245,158,11,0.12);
          border-color: rgba(245,158,11,0.35);
          color: #f59e0b;
        }
        .ss-cta { padding: 52px 40px; }
        @media (max-width: 900px) {
          .ss-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .ss-grid { grid-template-columns: 1fr; }
          .ss-cta { padding: 36px 20px; }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            App Screenshots
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(28px, 5vw, 50px)', lineHeight: 1.08, letterSpacing: '-1px', color: '#f8fafc', maxWidth: 680, margin: '0 auto 20px', fontWeight: 800 }}>
            See BarGuard <em style={{ color: '#f59e0b', fontStyle: 'italic' }}>in action</em>
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.65 }}>
            A real look at every feature — no marketing fluff, just the actual product your bar will use every day.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="screenshots_hero_start_trial" style={{ fontSize: 15, padding: '11px 24px', borderRadius: 10 }}>
              Start Free Trial
            </Link>
            <Link href="/features" data-gtm-event="cta_click" data-gtm-label="screenshots_hero_view_features" style={{ fontSize: 15, padding: '11px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              View All Features
            </Link>
          </div>
        </section>

        {/* GRID */}
        <section style={{ paddingBottom: 96 }}>
          <div className="ss-grid">
            {SCREENSHOTS.map((s, i) => (
              <div
                key={s.file}
                className="ss-card"
                onClick={() => setActive(i)}
                role="button"
                tabIndex={0}
                aria-label={`View ${s.label} screenshot`}
                onKeyDown={e => e.key === 'Enter' && setActive(i)}
              >
                <div className="ss-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/${s.file}`}
                    alt={`${s.label} screenshot`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                  />
                  <div className="ss-overlay">
                    <div className="ss-expand">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '18px 20px 22px' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ paddingBottom: 96 }}>
          <div className="ss-cta" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: '#f8fafc', marginBottom: 14 }}>
              Ready to run a tighter bar?
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Start your free trial and see every one of these features working with your own data.
            </p>
            <Link href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="screenshots_cta_get_started" style={{ fontSize: 15, padding: '12px 28px', borderRadius: 10 }}>
              Get Started Free
            </Link>
          </div>
        </section>
      </div>

      {/* LIGHTBOX */}
      {active !== null && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(2,8,23,0.94)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 80px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%', width: '100%' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{active + 1} / {SCREENSHOTS.length}</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{SCREENSHOTS[active].label}</p>
              <button onClick={close} className="lb-btn" aria-label="Close">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Image + arrow buttons */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="lb-btn"
                aria-label="Previous"
                style={{ position: 'absolute', left: -60, top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/${SCREENSHOTS[active].file}`}
                alt={`${SCREENSHOTS[active].label} screenshot`}
                style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 12, border: '1px solid #1e293b', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', objectFit: 'contain', display: 'block' }}
              />

              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="lb-btn"
                aria-label="Next"
                style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Description */}
            <p style={{ marginTop: 16, fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 480 }}>
              {SCREENSHOTS[active].description}
            </p>

            {/* Dot nav */}
            <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {SCREENSHOTS.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActive(i) }}
                  aria-label={`Go to ${SCREENSHOTS[i].label}`}
                  style={{ width: i === active ? 20 : 7, height: 7, borderRadius: 4, background: i === active ? '#f59e0b' : '#1e293b', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.2s, background 0.2s' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
