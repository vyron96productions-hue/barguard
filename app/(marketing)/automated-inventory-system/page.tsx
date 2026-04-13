import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Automated Inventory System for Bars — No More Spreadsheets',
  description: 'BarGuard automates bar inventory tracking with POS sync every 5 minutes, AI invoice scanning, and shift-based variance calculations — so you spend minutes, not hours.',
  alternates: { canonical: 'https://barguard.app/automated-inventory-system' },
  openGraph: {
    title: 'Automated Inventory System for Bars — No More Spreadsheets | BarGuard',
    description: 'Replace manual counts and CSV imports with automatic POS sync, AI invoice scanning, and instant variance reports. BarGuard runs itself.',
    url: 'https://barguard.app/automated-inventory-system',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function AutomatedInventorySystemPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <style>{`
        .ais-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ais-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ais-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; transition: border-color 0.2s; }
        .ais-card:hover { border-color: rgba(245,158,11,0.35); }
        @media (max-width: 768px) { .ais-grid-2, .ais-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Automated Inventory
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Automated Inventory System<br />
            <span style={{ color: '#f59e0b' }}>That Runs Itself Between Counts</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Manual inventory takes hours you don't have and produces numbers that are already stale. BarGuard automates the data collection, syncing, and calculation so your only job is a quick count — everything else happens automatically.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="ais_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See How It Works
            </Link>
          </div>
        </section>

        {/* WHAT'S AUTOMATED */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            What BarGuard automates for you
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 560, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            Most of the work in inventory management isn't counting — it's all the data entry, matching, and math around the count. BarGuard handles all of it.
          </p>
          <div className="ais-grid-2">
            {[
              {
                icon: '⟳',
                color: '#f59e0b',
                title: 'POS sync every 5 minutes',
                body: 'Connect Square, Toast, or Clover once. BarGuard pulls sales data automatically — no CSV exports, no manual imports, no copy-pasting menu items.',
              },
              {
                icon: '◈',
                color: '#34d399',
                title: 'AI invoice scanning',
                body: 'Photograph your paper delivery invoice. AI reads every line item, matches it to your inventory, and creates a draft for review in under a minute.',
              },
              {
                icon: '✦',
                color: '#818cf8',
                title: 'Automatic variance calculations',
                body: 'After your count, BarGuard immediately calculates expected vs actual usage for every item — no formulas, no spreadsheet, no manual math.',
              },
              {
                icon: '⊕',
                color: '#fb923c',
                title: 'Email invoice import',
                body: 'Distributor sends invoices by email? Connect your inbox and BarGuard pulls them in automatically — no forwarding required.',
              },
              {
                icon: '◎',
                color: '#60a5fa',
                title: 'Reorder alerts',
                body: 'Set a minimum stock level per item. BarGuard flags anything below threshold automatically — so you never discover you\'re out mid-service.',
              },
              {
                icon: '⊘',
                color: '#f472b6',
                title: 'AI variance summaries',
                body: 'After each calculation, BarGuard writes a plain-English summary of your top risk items, their cost impact, and recommended actions — no interpretation required.',
              },
            ].map((f) => (
              <div key={f.title} className="ais-card" style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, minWidth: 40, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: 16, fontFamily: 'monospace' }}>{f.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 14 }}>{f.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEFORE / AFTER */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 28, fontFamily: 'var(--font-montserrat)' }}>
            Manual inventory vs. BarGuard
          </h2>
          <div className="ais-grid-2">
            {[
              { bad: 'Export CSV from POS every week manually', good: 'POS syncs automatically every 5 minutes' },
              { bad: 'Type invoice line items into a spreadsheet', good: 'AI scans invoices from a photo in under 60 seconds' },
              { bad: 'Calculate variance by hand across 100+ items', good: 'One-click variance report, results in seconds' },
              { bad: 'Discover a shortage after you run out', good: 'Reorder alerts fire before you hit zero' },
              { bad: 'Read a spreadsheet and interpret the numbers yourself', good: 'AI writes a plain-English summary of what needs attention' },
              { bad: 'Count every shift manually on paper', good: 'Mobile count screen — tap through items, saves as you go' },
            ].map((c) => (
              <div key={c.bad} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>✗  {c.bad}</p>
                <p style={{ fontSize: 13, color: '#34d399' }}>✓  {c.good}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            How the automation works, step by step
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
            You set it up once. After that, BarGuard runs in the background between every shift.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '01', t: 'Connect your POS', d: 'OAuth or credentials — takes 2 minutes. BarGuard immediately pulls your full item list and sales history.' },
              { n: '02', t: 'Add your inventory and recipes', d: 'Import via CSV or enter items manually. Link drinks to their ingredient bottles so expected usage can be calculated.' },
              { n: '03', t: 'Run a beginning count', d: 'Use the mobile count screen to tap through items before the shift starts. Counts save in real time.' },
              { n: '04', t: 'Let the shift run — POS syncs itself', d: 'Every 5 minutes, BarGuard pulls the latest sales. No action required from you.' },
              { n: '05', t: 'Run an ending count and click Calculate', d: 'BarGuard compares actual usage against POS-expected usage. Every item gets a status: Normal, Warning, or Critical.' },
              { n: '06', t: 'Read the AI summary and act', d: 'The AI summary tells you which items to address, what the cost impact is, and what likely caused the variance.' },
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

        {/* STATS */}
        <section style={{ marginBottom: 80 }}>
          <div className="ais-grid-3">
            {[
              { stat: '5 min', label: 'POS sync interval', sub: 'Sales data is never more than 5 minutes old — even mid-shift.' },
              { stat: '< 60s', label: 'invoice scan time', sub: 'AI reads a 20-line paper invoice faster than you could type the first item.' },
              { stat: '3 hrs', label: 'saved per week', sub: 'Average time BarGuard saves compared to manual inventory workflows.' },
            ].map((b) => (
              <div key={b.label} style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-montserrat)', marginBottom: 8 }}>{b.stat}</p>
                <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 14 }}>{b.label}</p>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{b.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="ais-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'The full BarGuard platform — tracking, variance, and profit analytics together.' },
              { href: '/bar-inventory-app', label: 'Bar Inventory App', desc: 'Mobile-first counts, POS sync, and reporting from any device.' },
              { href: '/pricing', label: 'View Pricing', desc: 'All automation features included from $129/month.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Screenshots of automated sync, scan, and variance in action.' },
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
            Stop doing manually what software can do automatically
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            Connect your POS, run your first count, and see your first variance report — in under 30 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="ais_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
