import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Track Bar Inventory: Step-by-Step Guide | BarGuard',
  description: 'Learn how to track bar inventory accurately — from setting up items and connecting your POS to running variance reports and eliminating shrinkage.',
  alternates: { canonical: 'https://barguard.app/how-to-track-bar-inventory' },
  openGraph: {
    title: 'How to Track Bar Inventory: Step-by-Step Guide | BarGuard',
    description: 'Learn how to track bar inventory accurately — from setting up items and connecting your POS to running variance reports and eliminating shrinkage.',
    url: 'https://barguard.app/how-to-track-bar-inventory',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/Barguard_web_banner.webp', width: 1200, height: 630, alt: 'BarGuard — Bar Inventory Tracking System' }],
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Track Bar Inventory',
  description: 'A step-by-step process for tracking bar inventory accurately using counts, POS integration, drink recipes, and variance reports.',
  url: 'https://barguard.app/how-to-track-bar-inventory',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Set Up Your Inventory Items', text: 'Add all bottles, kegs, and ingredients into your system with accurate units, categories, and costs.' },
    { '@type': 'HowToStep', position: 2, name: 'Count Your Stock', text: 'Perform physical counts on a regular schedule and log them with timestamps.' },
    { '@type': 'HowToStep', position: 3, name: 'Connect Your POS', text: 'Sync your POS system so sales data flows into your inventory calculations automatically.' },
    { '@type': 'HowToStep', position: 4, name: 'Build Drink Recipes', text: 'Define ingredients and quantities for each menu item so theoretical usage can be calculated.' },
    { '@type': 'HowToStep', position: 5, name: 'Run Variance Reports', text: 'Compare expected usage against actual usage to find overpouring, theft, and waste.' },
  ],
}

export default function HowToTrackBarInventoryPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .htbi-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .htbi-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .htbi-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; transition: border-color 0.2s; }
        .htbi-card:hover { border-color: rgba(245,158,11,0.35); }
        @media (max-width: 768px) {
          .htbi-grid-2, .htbi-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Bar Inventory Tracking
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            How to Track Bar Inventory<br />
            <span style={{ color: '#f59e0b' }}>The Right Way</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Counting bottles isn&apos;t inventory tracking. Real tracking connects your counts to sales data and recipes — so you know <strong style={{ color: '#f1f5f9' }}>exactly where every ounce goes.</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="htbi_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="htbi_hero_how" style={{ padding: '14px 28px', fontSize: 15 }}>
              See How It Works
            </Link>
          </div>
        </section>

        {/* THE CORE CONCEPT */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '40px 40px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-montserrat)' }}>
              Why most bars can&apos;t answer: &ldquo;Where is my money going?&rdquo;
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.75, marginBottom: 24 }}>
              Manual counts and spreadsheets tell you what you <em>have</em>. They don&apos;t tell you what you <em>should have</em>. Without connecting inventory to sales and recipes, you&apos;re counting bottles but not controlling loss.
            </p>
            <div className="htbi-grid-3">
              {[
                { icon: '📦', title: 'Inventory Counts', body: 'What you physically have on the shelf — the baseline for every calculation.' },
                { icon: '🧾', title: 'POS Sales Data', body: 'What was sold, when, and how much — drives expected usage.' },
                { icon: '🍹', title: 'Drink Recipes', body: 'What each item contains — links sales to specific inventory items.' },
              ].map((p) => (
                <div key={p.title} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '22px 20px' }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{p.icon}</div>
                  <p style={{ fontWeight: 600, color: '#fbbf24', marginBottom: 6, fontSize: 15 }}>{p.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{p.body}</p>
                </div>
              ))}
            </div>
            <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: 15, marginTop: 24, textAlign: 'center' }}>
              Connect all three → you can calculate: expected usage vs. actual usage = where your money is going.
            </p>
          </div>
        </section>

        {/* STEP-BY-STEP */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            How to Track Bar Inventory: 5 Steps
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 640 }}>
            This is the system every profitable bar uses — whether they&apos;re doing it manually or with software like BarGuard.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                n: '01',
                t: 'Set Up Your Inventory Items',
                d: 'Add every bottle, keg, and ingredient to your system with the correct unit of measure (oz, bottle, keg, lb, each), category, and cost per unit. This is your master item list — accuracy here cascades into every calculation.',
                tip: 'BarGuard lets you bulk import via CSV or auto-categorize your full list using AI. Setup takes minutes.',
              },
              {
                n: '02',
                t: 'Count Your Stock Regularly',
                d: 'Perform physical counts on a consistent schedule — weekly for spirits and high-cost items, twice weekly for high-turnover categories. Always count at the same time (before open or after close) so your data is comparable across cycles.',
                tip: 'Each count is timestamped so you always know the exact baseline for your next variance calculation.',
              },
              {
                n: '03',
                t: 'Connect Your POS System',
                d: 'Your POS tells you what was sold, when, and how many — that\'s the data that drives expected usage. Without this connection, you\'re estimating instead of calculating. BarGuard integrates with Square, Clover, Toast, and Focus POS.',
                tip: 'Sales sync automatically. No manual data entry between your POS and your inventory system.',
              },
              {
                n: '04',
                t: 'Build Recipes for Every Menu Item',
                d: 'Each drink or food item needs a recipe that defines its ingredients and quantities. This is what lets the system calculate: for every unit of this drink sold, X oz of vodka and Y oz of lime juice should have been consumed.',
                tip: 'BarGuard\'s AI can suggest recipes based on your menu item names — then you confirm or adjust.',
              },
              {
                n: '05',
                t: 'Run Variance Reports After Every Count',
                d: 'Compare expected usage (from sales × recipes) against actual usage (from your physical count delta). The gap is your variance — and it tells you exactly where loss is happening: overpouring, theft, waste, or receiving errors.',
                tip: 'Flag anything above 5–10% variance as a priority item. Investigate while the trail is still warm.',
              },
            ].map((s) => (
              <div key={s.n} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '28px 28px' }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, minWidth: 44, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#f59e0b', fontSize: 14, fontFamily: 'var(--font-montserrat)' }}>{s.n}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8, fontSize: 17 }}>{s.t}</p>
                    <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>{s.d}</p>
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fbbf24', lineHeight: 1.6 }}>
                      <strong>With BarGuard:</strong> {s.tip}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHERE LOSS COMES FROM */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Where bars lose the most money
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            Once you start tracking properly, patterns become obvious fast. These are the four biggest sources of bar inventory loss.
          </p>
          <div className="htbi-grid-2">
            {[
              {
                icon: '⚖',
                title: 'Overpouring',
                body: 'A quarter ounce over per drink adds up to $200–$400 in lost revenue on a busy Saturday night — from a single bartender. Most overpouring is unintentional and invisible without variance data.',
              },
              {
                icon: '👁',
                title: 'Theft',
                body: 'Internal theft accounts for 35–40% of bar shrinkage. Short ringing, sweethearting, and bottle walking are nearly invisible without comparing what was sold to what was consumed.',
              },
              {
                icon: '💧',
                title: 'Spillage & Waste',
                body: 'Failed cocktails, broken bottles, and over-blended batches are expected at 1–2%. If your waste is higher, it\'s a training and workflow problem — not just bad luck.',
              },
              {
                icon: '📋',
                title: 'Bad Inventory Practices',
                body: 'Irregular counts, inconsistent partial-bottle estimates, and missing purchase reconciliation hide problems for weeks before anyone notices. Process matters more than effort.',
              },
            ].map((l) => (
              <div key={l.title} className="htbi-card" style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 42, height: 42, minWidth: 42, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{l.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 6, fontSize: 15 }}>{l.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.65 }}>{l.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section style={{ marginBottom: 80 }}>
          <div className="htbi-grid-3">
            {[
              { stat: '20–25%', label: 'of inventory lost to shrinkage at bars without systematic tracking' },
              { stat: '10%', label: 'max shrinkage target for a well-run bar with variance controls' },
              { stat: '3–8%', label: 'typical pour cost reduction after implementing proper tracking' },
            ].map((b) => (
              <div key={b.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 38, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-montserrat)', marginBottom: 10 }}>{b.stat}</p>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MANUAL VS SOFTWARE */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 32, fontFamily: 'var(--font-montserrat)' }}>
            Manual tracking vs. software: what&apos;s actually worth it?
          </h2>
          <div className="htbi-grid-2">
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '28px' }}>
              <p style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16, marginBottom: 16 }}>Spreadsheets</p>
              {[
                'Can technically track inventory',
                'No POS integration — theoretical usage by hand',
                'Slow to update, easy to corrupt',
                'Variance comparisons require manual formulas',
                'One copy, no version history',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ color: '#ef4444', marginTop: 2, fontSize: 13 }}>✗</span>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 16, padding: '28px' }}>
              <p style={{ fontWeight: 700, color: '#f59e0b', fontSize: 16, marginBottom: 16 }}>BarGuard</p>
              {[
                'POS syncs automatically — no manual entry',
                'Variance calculated in one click',
                'AI recipe suggestions from menu item names',
                'Reorder alerts when stock drops below par',
                'AI variance summaries flag your highest-risk items',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ color: '#f59e0b', marginTop: 2, fontSize: 13 }}>✓</span>
                  <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related Resources</h3>
          <div className="htbi-grid-2">
            {[
              { href: '/blog/bar-inventory-management-guide', label: 'Bar Inventory Management Guide', desc: 'The full breakdown: tracking, variance, shrinkage, and why most bars get it wrong.' },
              { href: '/blog/how-to-do-a-bar-inventory-count', label: 'How to Do a Bar Inventory Count', desc: 'Step-by-step counting process for bottles, kegs, partials, and storage areas.' },
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'See everything BarGuard does — POS sync, variance reports, AI scanning, and more.' },
              { href: '/stop-bartender-theft', label: 'Stop Bartender Theft', desc: 'Use shift-level variance data to detect patterns before losses compound.' },
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
            Start tracking the right way today
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            BarGuard connects your counts, your POS, and your recipes — so you see exactly where your inventory is going. No credit card required to start.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="htbi_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/pricing" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="htbi_bottom_pricing" style={{ padding: '14px 28px', fontSize: 15 }}>
              View Pricing
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
