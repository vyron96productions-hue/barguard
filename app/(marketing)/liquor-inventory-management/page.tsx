import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Liquor Inventory Management — Track Every Lost Ounce',
  description: 'BarGuard tracks your liquor inventory at the ounce level. Compare expected vs actual usage per shift and catch over-pouring before it costs you thousands.',
  alternates: { canonical: 'https://barguard.app/liquor-inventory-management' },
  openGraph: {
    title: 'Liquor Inventory Management — Track Every Lost Ounce | BarGuard',
    description: 'Oz-level liquor tracking with POS sync, shift variance reports, and AI summaries. Know exactly which bottles are over-poured and by how much.',
    url: 'https://barguard.app/liquor-inventory-management',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BarGuard Liquor Inventory Management',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://barguard.app/liquor-inventory-management',
  description: 'Liquor inventory management software with oz-level tracking, POS-linked expected usage, shift-based variance reports, and AI summaries.',
  offers: { '@type': 'Offer', price: '129', priceCurrency: 'USD', url: 'https://barguard.app/pricing' },
}

export default function LiquorInventoryManagementPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .lim-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .lim-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .lim-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; transition: border-color 0.2s; }
        .lim-card:hover { border-color: rgba(245,158,11,0.35); }
        @media (max-width: 768px) { .lim-grid-2, .lim-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Liquor Inventory Management
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Liquor Inventory Management<br />
            <span style={{ color: '#f59e0b' }}>That Catches Every Lost Ounce</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Your POS tells you what you sold. Your invoices tell you what you bought. BarGuard connects both to tell you <strong style={{ color: '#f1f5f9' }}>what disappeared in between</strong> — down to the ounce, by shift.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="lim_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See Screenshots
            </Link>
          </div>
        </section>

        {/* THE MATH */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '40px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-montserrat)' }}>
              The math that most bars are missing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Beginning inventory', val: '45.0 btl', color: '#94a3b8' },
                { label: '+ Purchases', val: '+12.0 btl', color: '#60a5fa' },
                { label: '− Ending inventory', val: '−38.0 btl', color: '#f87171' },
              ].map((m) => (
                <div key={m.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'var(--font-montserrat)' }}>{m.val}</p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '16px' }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actual Usage</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-montserrat)' }}>19.0 btl</p>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '16px' }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expected (from POS)</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-montserrat)' }}>14.3 btl</p>
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>+4.7 btl variance — Critical ⚠</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            Purpose-built for liquor tracking
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 540, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            Every BarGuard feature is designed around the specific way spirits, wine, beer, and kegs are poured, tracked, and costed.
          </p>
          <div className="lim-grid-2">
            {[
              { icon: '◈', title: 'Multiple unit types for every liquor format', body: 'Track bottles (750ml, 1L, 1.75L), cans, beer bottles, kegs (half, quarter, sixth), and cases. Each unit converts to oz automatically for cost calculations.' },
              { icon: '⊕', title: 'Cost per oz calculated automatically', body: 'Set a cost per unit. BarGuard divides by the bottle size to give you cost-per-oz for every spirit — so your pour cost is always accurate.' },
              { icon: '⟳', title: 'Recipe-linked expected usage', body: 'Map drinks to their ingredients. When your POS reports 60 Tito\'s vodka sodas, BarGuard expects exactly 90 oz of Tito\'s used — and flags the gap.' },
              { icon: '◐', title: 'Shift-level variance per spirit', body: 'Run Happy Hour, Dinner, or Late Night variance. See which specific spirits are over or under — not just total variance across the bar.' },
              { icon: '⊘', title: 'Keg tracking with partial levels', body: 'Kegs show as decimal quantities (0.75 keg, 0.5 keg). Partial bottle scanning estimates fill level from a camera photo.' },
              { icon: '✦', title: 'AI-powered variance summaries', body: 'After every calculation, Claude writes a plain-English paragraph summarizing your top risk items, likely causes, and recommended actions.' },
            ].map((f) => (
              <div key={f.title} className="lim-card" style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, minWidth: 40, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: 16, fontFamily: 'monospace' }}>{f.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 14 }}>{f.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, marginBottom: 24, fontFamily: 'var(--font-montserrat)' }}>
            What happens when liquor inventory isn't tracked properly
          </h2>
          <div className="lim-grid-3">
            {[
              { n: '$0.50', label: 'over-pour per drink', sub: 'adds up to ~$900/month for a 200-drink/day bar' },
              { n: '8–12%', label: 'average bar pour cost above target', sub: 'almost always tied to variance going unchecked' },
              { n: '3 weeks', label: 'average time to detect a problem', sub: 'when using spreadsheets or manual count sheets' },
            ].map((s) => (
              <div key={s.n} style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-montserrat)', marginBottom: 6 }}>{s.n}</p>
                <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 6 }}>{s.label}</p>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="lim-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'Full inventory platform — beverages, food, and paper in one system.' },
              { href: '/reduce-liquor-cost', label: 'Reduce Liquor Cost', desc: 'Practical strategies for bringing your pour cost back under control.' },
              { href: '/pricing', label: 'View Pricing', desc: 'Plans from $129/month with all liquor tracking features included.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Screenshots of variance reports and liquor tracking in action.' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: 'block', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '18px 20px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{l.label} →</p>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{l.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 24, padding: '56px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Stop guessing what's happening to your liquor
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 460, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            The first variance report usually pays for your subscription. Find out what yours shows.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="lim_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/pricing" className="btn-secondary" style={{ padding: '14px 24px', fontSize: 15 }}>
              View Pricing
            </Link>
          </div>
          <p style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>14-day free trial · No credit card required</p>
        </section>
      </div>
    </div>
  )
}
