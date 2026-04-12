'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const prices = {
  basic: [99, 79],
  pro: [199, 159],
  ent: [399, 319],
}

function CheckIcon() {
  return (
    <svg style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="9" fill="rgba(245,158,11,0.15)" />
      <path d="M5 9l3 3 5-5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PricingPage({ isSignedIn }: { isSignedIn: boolean }) {
  return <Suspense><PricingPageContent isSignedIn={isSignedIn} /></Suspense>
}

function PricingPageContent({ isSignedIn }: { isSignedIn: boolean }) {
  const [annual, setAnnual] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const expired      = searchParams.get('expired')      === '1'
  const memberLocked = searchParams.get('member_locked') === '1'

  async function handlePlanClick(plan: string) {
    if (!isSignedIn) {
      window.location.href = '/signup'
      return
    }
    setCheckoutLoading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billing: annual ? 'annual' : 'monthly' }),
    })
    const data = await res.json()
    setCheckoutLoading(null)
    if (data.url) window.location.href = data.url
  }

  function handleTrialClick() {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'trial_started' })
    window.location.href = '/dashboard'
  }

  const fmt = (key: keyof typeof prices) => annual ? prices[key][1] : prices[key][0]
  const annualNote = (key: keyof typeof prices) =>
    annual ? `$${prices[key][1] * 12}/yr — billed annually` : ''

  const cardBase: React.CSSProperties = {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 18,
    padding: '32px 28px',
    position: 'relative',
  }

  const featuredCard: React.CSSProperties = {
    ...cardBase,
    borderColor: '#f59e0b',
    boxShadow: '0 0 0 1px #f59e0b, 0 0 40px rgba(245,158,11,0.12), inset 0 0 60px rgba(245,158,11,0.03)',
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding-bottom: 100px; align-items: start; }
        .featured-card-transform { transform: translateY(-8px); }
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
          .featured-card-transform { transform: none; }
        }
        @media (max-width: 480px) {
          .pricing-grid { padding: 0 0 60px; }
        }
      `}</style>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      {/* Glow */}
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)'
      }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* Trial expired banner — owner */}
        {expired && !memberLocked && (
          <div style={{
            margin: '24px 0 -24px', padding: '14px 20px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>⏰</span>
            <div>
              <p style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, margin: 0 }}>Your free trial has expired</p>
              <p style={{ color: '#f87171', fontSize: 12, margin: '2px 0 0', opacity: 0.8 }}>Choose a plan below to keep using BarGuard.</p>
            </div>
          </div>
        )}

        {/* Access suspended banner — invited member (not the owner) */}
        {memberLocked && (
          <div style={{
            margin: '24px 0 -24px', padding: '14px 20px', borderRadius: 12,
            background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.3)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div>
              <p style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 600, margin: 0 }}>Your access is currently suspended</p>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0', opacity: 0.9 }}>The bar owner needs to update their subscription to restore access. Please contact them directly.</p>
            </div>
          </div>
        )}

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 28,
            fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b',
            letterSpacing: '0.08em', textTransform: 'uppercase' as const
          }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            Simple, transparent pricing
          </div>

          <h1 style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(32px, 5vw, 54px)',
            lineHeight: 1.08, letterSpacing: '-1px', color: '#f8fafc',
            maxWidth: 680, margin: '0 auto 18px', fontWeight: 800
          }}>
            Pricing that <em style={{ color: '#f59e0b', fontStyle: 'italic' }}>pays for itself</em>
          </h1>

          <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 460, margin: '0 auto', lineHeight: 1.6, fontWeight: 400 }}>
            AI-powered loss detection for bars and venues. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 36 }}>
            <span style={{ fontSize: 14, color: annual ? '#94a3b8' : '#f8fafc', fontWeight: 500 }}>Monthly</span>
            <div
              onClick={() => setAnnual(!annual)}
              style={{
                width: 48, height: 26, background: annual ? '#b45309' : '#1e293b',
                borderRadius: 100, position: 'relative', cursor: 'pointer',
                border: '1px solid #1e293b', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 20, height: 20, background: 'white', borderRadius: '50%',
                position: 'absolute', top: 2, left: 3,
                transform: annual ? 'translateX(22px)' : 'translateX(0)',
                transition: 'transform 0.2s'
              }} />
            </div>
            <span style={{ fontSize: 14, color: annual ? '#f8fafc' : '#94a3b8', fontWeight: 500 }}>Annual</span>
            <span style={{
              background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
              letterSpacing: '0.04em', fontFamily: 'monospace'
            }}>Save 20%</span>
          </div>
        </section>

        {/* PRICING GRID */}
        <div className="pricing-grid">

          {/* BASIC */}
          <div style={cardBase}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#475569', marginBottom: 20 }}>Basic</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 42, color: '#f8fafc', lineHeight: 1, letterSpacing: '-2px' }}>${fmt('basic')}</span>
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 400 }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 24, minHeight: 18 }}>
              {annual ? <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>${prices.basic[1] * 12}/yr</span> — billed annually</span> : <>&nbsp;</>}
            </div>
            <div style={{ height: 1, background: '#1e293b', marginBottom: 24 }} />
            <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' as const, marginBottom: 14 }}>Included</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
              {['Inventory tracking', 'AI purchase scanning', 'Stock & reorder alerts', '30-day sales history'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#94a3b8', lineHeight: 1.45 }}>
                  <CheckIcon />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handlePlanClick('basic')} disabled={checkoutLoading === 'basic'} className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="pricing_basic_get_started" style={{ display: 'block', width: '100%', padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center' as const, boxSizing: 'border-box' as const, cursor: 'pointer' }}>
              {checkoutLoading === 'basic' ? 'Loading…' : 'Start free trial'}
            </button>
          </div>

          {/* PRO (FEATURED) */}
          <div className="featured-card-transform" style={featuredCard}>
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#020817', fontFamily: 'monospace', fontSize: 10.5, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>
              ⭐ Most Popular
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#f59e0b', marginBottom: 20 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 42, color: '#f8fafc', lineHeight: 1, letterSpacing: '-2px' }}>${fmt('pro')}</span>
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 400 }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 24, minHeight: 18 }}>
              {annual ? <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>${prices.pro[1] * 12}/yr</span> — billed annually</span> : <>&nbsp;</>}
            </div>
            <div style={{ height: 1, background: '#1e293b', marginBottom: 24 }} />
            <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' as const, marginBottom: 14 }}>Included</div>
            <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', borderLeft: '2px solid rgba(245,158,11,0.3)', paddingLeft: 10, marginBottom: 14, lineHeight: 1.5 }}>Everything in Basic, plus:</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
              {['Full sales history', 'Vendor management', 'Automated reorder suggestions', 'POS integration', 'Data export'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#94a3b8', lineHeight: 1.45 }}>
                  <CheckIcon />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handlePlanClick('pro')} disabled={checkoutLoading === 'pro'} className="btn-primary" data-gtm-event="cta_click" data-gtm-label="pricing_pro_start_trial" style={{ display: 'block', width: '100%', padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center' as const, boxSizing: 'border-box' as const, cursor: 'pointer' }}>
              {checkoutLoading === 'pro' ? 'Loading…' : 'Start free trial'}
            </button>
          </div>

          {/* ENTERPRISE */}
          <div style={cardBase}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#475569', marginBottom: 20 }}>Enterprise</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 42, color: '#f8fafc', lineHeight: 1, letterSpacing: '-2px' }}>${fmt('ent')}</span>
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 400 }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 24, minHeight: 18 }}>
              {annual ? <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>${prices.ent[1] * 12}/yr</span> — billed annually</span> : <>&nbsp;</>}
            </div>
            <div style={{ height: 1, background: '#1e293b', marginBottom: 24 }} />
            <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' as const, marginBottom: 14 }}>Included</div>
            <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', borderLeft: '2px solid #1e293b', paddingLeft: 10, marginBottom: 14, lineHeight: 1.5 }}>Everything in Pro, plus:</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
              {['Up to 5 locations', 'Priority support'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#94a3b8', lineHeight: 1.45 }}>
                  <CheckIcon />{f}
                </li>
              ))}
            </ul>
            <a href="mailto:support@barguard.app" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="pricing_enterprise_contact_sales" style={{ display: 'block', width: '100%', padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center' as const, boxSizing: 'border-box' as const }}>
              Contact sales
            </a>
          </div>

        </div>

        {/* FREE TRIAL CTA — signed-in users only */}
        {isSignedIn && (
          <div style={{
            margin: '8px 0 40px',
            padding: '28px 32px',
            background: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>Not ready to pick a plan?</p>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Start your free 14-day trial — full access, no credit card required.</p>
            </div>
            <button
              onClick={handleTrialClick}
              data-gtm-event="cta_click"
              data-gtm-label="pricing_start_free_trial"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'transparent',
                border: '1px solid rgba(245,158,11,0.4)',
                color: '#f59e0b',
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 10,
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
              }}
            >
              Start free trial — no card needed →
            </button>
          </div>
        )}

        {/* TRUST STRIP */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', borderTop: '1px solid #1e293b', paddingTop: 48, paddingBottom: 80, marginTop: -20 }}>
          {[
            { icon: '🔒', text: 'Your data stays private' },
            { icon: '↩️', text: 'Cancel anytime' },
            { icon: '🚀', text: 'Easy setup' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 18, opacity: 0.7 }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
