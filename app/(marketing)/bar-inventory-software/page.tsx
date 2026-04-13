import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bar Inventory Software That Pays for Itself',
  description: 'BarGuard is bar inventory software that tracks every ounce, syncs with your POS, and shows exactly where you\'re losing money. Start free — no card required.',
  alternates: { canonical: 'https://barguard.app/bar-inventory-software' },
  openGraph: {
    title: 'Bar Inventory Software That Pays for Itself | BarGuard',
    description: 'Track every ounce, sync with your POS, and catch shrinkage before it costs you. Real bar inventory software built for working bar owners.',
    url: 'https://barguard.app/bar-inventory-software',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BarGuard Bar Inventory Software',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://barguard.app/bar-inventory-software',
  description: 'Bar inventory software with POS sync, variance reports, AI invoice scanning, and shift-based loss detection.',
  offers: { '@type': 'Offer', price: '129', priceCurrency: 'USD', url: 'https://barguard.app/pricing' },
}

export default function BarInventorySoftwarePage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .seo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .seo-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .seo-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; }
        .seo-card:hover { border-color: rgba(245,158,11,0.4); }
        .seo-step { display: flex; gap: 20px; align-items: flex-start; }
        .seo-step-num { width: 36px; height: 36px; min-width: 36px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #f59e0b; font-size: 15px; }
        @media (max-width: 768px) {
          .seo-grid-2, .seo-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Bar Inventory Software
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Bar Inventory Software<br />
            <span style={{ color: '#f59e0b' }}>That Pays for Itself</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            The average bar loses <strong style={{ color: '#f1f5f9' }}>$30,000+ per year</strong> to shrinkage, over-pouring, and untracked waste. BarGuard is bar inventory software built to find that money and give it back to you.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bis_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="bis_hero_how" style={{ padding: '14px 28px', fontSize: 15 }}>
              See How It Works
            </Link>
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '40px 40px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-montserrat)' }}>
              Manual inventory tracking is costing you thousands
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 16, lineHeight: 1.7 }}>
              Spreadsheets, clipboards, and gut-feel guesses don't catch a bartender free-pouring for friends. They don't flag when your well vodka usage is 40% over expected. They don't connect your purchase costs to your actual sales — so you never know your real pour cost.
            </p>
            <div className="seo-grid-3">
              {[
                { icon: '⚠', title: 'Over-pouring', body: 'Even 0.5 oz extra per drink adds up to $800–$2,000/month on a busy bar.' },
                { icon: '◌', title: 'Shrinkage & Theft', body: 'Free drinks, walk-outs, and employee theft rarely show up in manual counts.' },
                { icon: '⊘', title: 'Inventory Errors', body: 'Mismatched count sheets hide losses for weeks before anyone notices.' },
              ].map((p) => (
                <div key={p.title} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '20px 22px' }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{p.icon}</div>
                  <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 6, fontSize: 15 }}>{p.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            BarGuard connects the dots between inventory and sales
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 580, margin: '0 auto 40px', fontSize: 16, lineHeight: 1.7 }}>
            Instead of just counting bottles, BarGuard compares what you <em>should</em> have used against what you actually used — and flags every discrepancy.
          </p>
          <div className="seo-grid-2">
            {[
              { icon: '⇄', title: 'POS Integration', body: 'Connect Square, Toast, Clover, or Focus POS. Sales sync automatically — no manual entry.' },
              { icon: '◈', title: 'Variance Calculations', body: 'Run shift-based or date-range variance reports in one click. See exactly which items are over-poured or missing.' },
              { icon: '⟳', title: 'AI Invoice Scanning', body: 'Photograph your invoices. AI extracts line items, matches them to inventory, and logs your purchases.' },
              { icon: '◎', title: 'Stock Level Tracking', body: 'Always know what\'s on hand. Count by category, filter by type, and get reorder alerts before you run out.' },
              { icon: '✦', title: 'AI Variance Summaries', body: 'After each calculation, BarGuard\'s AI writes a plain-English summary of your highest-risk items.' },
              { icon: '⊕', title: 'Shift-Based Analysis', body: 'Compare Happy Hour vs. Dinner vs. Late Night. Pinpoint exactly which staff or shift is driving losses.' },
            ].map((f) => (
              <div key={f.title} className="seo-card" style={{ display: 'flex', gap: 16, transition: 'border-color 0.2s' }}>
                <div style={{ width: 40, height: 40, minWidth: 40, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: 16, fontFamily: 'monospace' }}>{f.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 15 }}>{f.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            From setup to savings in under 30 minutes
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 520, margin: '0 auto 40px', fontSize: 15 }}>No consultant. No training. Just log in and start tracking.</p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '36px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '01', t: 'Add your inventory items', d: 'Import via CSV or add manually. Set units, categories, and costs. BarGuard auto-categorizes with AI.' },
              { n: '02', t: 'Connect your POS', d: 'Link Square, Toast, Clover, or Focus POS. Your sales data syncs automatically — every 5 minutes.' },
              { n: '03', t: 'Count your stock', d: 'Use the Count Now screen on any device. Enter quantities by category. Takes 15–20 minutes.' },
              { n: '04', t: 'Run variance calculations', d: 'Select your date range or shift. Click Run. BarGuard compares expected vs actual usage instantly.' },
              { n: '05', t: 'Find the loss, fix the problem', d: 'See your critical and warning items. Get an AI summary. Take action — adjust pours, have conversations, fix reorders.' },
            ].map((s) => (
              <div key={s.n} className="seo-step">
                <div className="seo-step-num">{s.n}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 4, fontSize: 15 }}>{s.t}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 32, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            What bar owners say changes first
          </h2>
          <div className="seo-grid-3">
            {[
              { stat: '2–4 hrs', label: 'Saved per inventory count vs. spreadsheets' },
              { stat: '8–15%', label: 'Average reduction in pour cost within 60 days' },
              { stat: '1 week', label: 'Typical time to spot the first major discrepancy' },
            ].map((b) => (
              <div key={b.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 38, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-montserrat)', marginBottom: 8 }}>{b.stat}</p>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related Resources</h3>
          <div className="seo-grid-2">
            {[
              { href: '/liquor-inventory-management', label: 'Liquor Inventory Management', desc: 'Track every ounce of your spirits, wine, and beer with oz-level precision.' },
              { href: '/restaurant-inventory-software', label: 'Restaurant Inventory Software', desc: 'Manage beverages, food, and paper supplies in one unified system.' },
              { href: '/reduce-liquor-cost', label: 'Reduce Liquor Cost', desc: 'Identify exactly what\'s driving your pour cost above target.' },
              { href: '/stop-bartender-theft', label: 'Stop Bartender Theft', desc: 'Use shift-level variance data to catch suspicious patterns early.' },
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
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Ready to stop the bleeding?
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            Join hundreds of bar owners using BarGuard to protect their margins. No credit card required to start.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bis_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/pricing" className="btn-secondary" style={{ padding: '14px 24px', fontSize: 15 }}>
              View Pricing
            </Link>
          </div>
          <p style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>14-day free trial · No setup fees · Cancel anytime</p>
        </section>

      </div>
    </div>
  )
}
