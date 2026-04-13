import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Restaurant Inventory Software for Bars & Kitchens',
  description: 'BarGuard manages beverages, food, and paper supplies in one place. Variance reports, POS sync, and AI invoice scanning for the full operation.',
  alternates: { canonical: 'https://barguard.app/restaurant-inventory-software' },
  openGraph: {
    title: 'Restaurant Inventory Software for Bars & Kitchens | BarGuard',
    description: 'Track beverages, food, and paper supplies. Sync your POS. Run variance reports by shift or date range. BarGuard covers the full restaurant operation.',
    url: 'https://barguard.app/restaurant-inventory-software',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BarGuard Restaurant Inventory Software',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://barguard.app/restaurant-inventory-software',
  description: 'Restaurant inventory software covering beverages, food, and paper supplies with POS sync, variance analysis, and AI invoice scanning.',
  offers: { '@type': 'Offer', price: '129', priceCurrency: 'USD', url: 'https://barguard.app/pricing' },
}

export default function RestaurantInventorySoftwarePage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .ris-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ris-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ris-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; transition: border-color 0.2s; }
        .ris-card:hover { border-color: rgba(245,158,11,0.35); }
        @media (max-width: 768px) { .ris-grid-2, .ris-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Restaurant Inventory Software
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Restaurant Inventory Software<br />
            <span style={{ color: '#f59e0b' }}>Built for the Full Operation</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Most inventory tools only handle beverages. BarGuard tracks <strong style={{ color: '#f1f5f9' }}>beverages, food, and paper supplies</strong> in one system — with the same variance analysis, POS sync, and AI tools across every category.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="ris_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See Screenshots
            </Link>
          </div>
        </section>

        {/* THREE INVENTORY TYPES */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            One system for every type of inventory
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 540, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            Stop juggling separate tools for your bar and your kitchen. BarGuard handles it all with the right units and categories for each type.
          </p>
          <div className="ris-grid-3">
            {[
              {
                color: '#f59e0b', label: 'Beverages', icon: '◈',
                items: ['Spirits, wine, beer, kegs', 'Track by bottle, case, or keg', 'oz-level cost precision', 'POS-synced expected usage', 'Shift variance by pour type'],
              },
              {
                color: '#34d399', label: 'Food & Kitchen', icon: '◐',
                items: ['Proteins, produce, dairy', 'Track by lb, each, portion', 'Link to recipe costs', 'Count by prep category', 'Expiry-aware reorder alerts'],
              },
              {
                color: '#60a5fa', label: 'Paper & Supplies', icon: '◎',
                items: ['Cups, napkins, to-go boxes', 'Paper towels, cleaning supplies', 'Track by pack, roll, sleeve', 'Never run out mid-service', 'Bulk reorder triggers'],
              },
            ].map((t) => (
              <div key={t.label} style={{ background: '#0f172a', border: `1px solid rgba(${t.color === '#f59e0b' ? '245,158,11' : t.color === '#34d399' ? '52,211,153' : '96,165,250'},0.2)`, borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ color: t.color, fontSize: 18, fontFamily: 'monospace' }}>{t.icon}</span>
                  <span style={{ fontWeight: 700, color: t.color, fontSize: 16 }}>{t.label}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {t.items.map((i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                      <span style={{ color: t.color, marginTop: 2, fontSize: 10 }}>●</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 28, fontFamily: 'var(--font-montserrat)' }}>
            The restaurant inventory problem nobody talks about
          </h2>
          <div className="ris-grid-2">
            {[
              { title: 'Siloed counting', body: 'Your bar manager counts bottles. Your kitchen manager counts proteins. Nobody reconciles the full picture against what the POS sold.' },
              { title: 'Purchase-to-sales blindspot', body: 'You know what you ordered. You know what you sold. But the gap between them — the actual loss — stays invisible until you run the numbers manually.' },
              { title: 'No cost-per-item insight', body: 'Without linking your purchase invoices to your recipe costs, you can\'t know your actual pour cost or plate cost per item.' },
              { title: 'Paper waste goes untracked', body: 'Napkins, cups, and to-go containers are consumables that add up fast. Most operations have no idea what\'s actually disappearing.' },
            ].map((p) => (
              <div key={p.title} className="ris-card">
                <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 8, fontSize: 15 }}>{p.title}</p>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SOLUTION */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            BarGuard closes the loop from purchase to sale
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 580, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            Connect your POS, scan your invoices, count your stock, and run the report. BarGuard shows you exactly where each category stands.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { n: '01', t: 'Import or add all inventory items', d: 'Add beverages, food, and paper items. Use CSV import or type them in. AI auto-categorizes everything.' },
              { n: '02', t: 'Sync your POS for real-time sales', d: 'Square, Toast, Clover, and Focus POS sync every 5 minutes. No manual sales entry.' },
              { n: '03', t: 'Scan invoices when deliveries arrive', d: 'Photograph your invoices. AI reads the line items and logs every purchase automatically.' },
              { n: '04', t: 'Count stock by category', d: 'Filter to beverages, food, or paper. Count what matters for this shift or this week.' },
              { n: '05', t: 'Run the variance report', d: 'BarGuard shows expected vs actual usage, total revenue, covers, and an AI-written risk summary.' },
            ].map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, minWidth: 36, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>{s.n}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 4, fontSize: 15 }}>{s.t}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="ris-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'Deep-dive into how BarGuard handles your full bar operation.' },
              { href: '/bar-profit-tracking', label: 'Bar Profit Tracking', desc: 'See drink-level profitability and identify your highest-margin items.' },
              { href: '/pricing', label: 'View Pricing', desc: 'Plans starting at $129/month. No long-term contracts.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Real screenshots of every feature in BarGuard.' },
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
            Get your full operation under control
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 460, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            Start with beverages or add all three categories from day one. Setup takes less than 30 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="ris_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
