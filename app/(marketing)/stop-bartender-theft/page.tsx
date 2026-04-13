import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Stop Bartender Theft Before It Destroys Your Margins',
  description: 'BarGuard uses shift-level variance reports to expose suspicious patterns — over-poured bottles, unaccounted spirits, and stock that disappears without a sale.',
  alternates: { canonical: 'https://barguard.app/stop-bartender-theft' },
  openGraph: {
    title: 'Stop Bartender Theft Before It Destroys Your Margins | BarGuard',
    description: 'Catch over-pouring, free drinks, and missing stock with shift-based variance analysis. BarGuard gives you proof, not suspicion.',
    url: 'https://barguard.app/stop-bartender-theft',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BarGuard — Bartender Theft Detection',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://barguard.app/stop-bartender-theft',
  description: 'Bar inventory software that uses shift-based variance analysis to detect over-pouring, ghost pours, and missing bottles — with item-level evidence.',
  offers: { '@type': 'Offer', price: '129', priceCurrency: 'USD', url: 'https://barguard.app/pricing' },
}

export default function StopBartenderTheftPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .sbt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sbt-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 768px) { .sbt-grid-2, .sbt-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 999, fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 24 }}>
            Theft Detection
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Stop Bartender Theft<br />
            <span style={{ color: '#f59e0b' }}>Before It Destroys Your Margins</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            The American Bar Association estimates <strong style={{ color: '#f1f5f9' }}>bartender theft costs bars $6,000+ per employee per year</strong>. The problem isn't that you can't afford cameras — it's that you can't see the pattern in the data. BarGuard makes it visible.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="sbt_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See It in Action
            </Link>
          </div>
        </section>

        {/* HOW THEFT HIDES */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Why bartender theft is so hard to catch
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 15, lineHeight: 1.7, maxWidth: 620 }}>
            Theft at the bar doesn't look like theft — it looks like over-pouring, spillage, or a slow night. Without comparing actual usage against expected usage by shift, it's invisible.
          </p>
          <div className="sbt-grid-3">
            {[
              { title: 'Free drinks for friends', body: 'A bartender rings a soda water and pours a vodka soda. The POS shows a sale. The inventory shows a full pour of spirit with no corresponding charge.' },
              { title: 'Phantom drinks ("ghost pours")', body: 'Drinks made and handed off without any POS entry. No void, no comp — just product that disappears and cash that never makes it to the register.' },
              { title: 'Walk-away theft', body: 'Bottles that disappear from behind the bar entirely. Without a count-before and count-after workflow, you only notice months later when you reorder and wonder why.' },
            ].map((t) => (
              <div key={t.title} style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '22px' }}>
                <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 8, fontSize: 14 }}>{t.title}</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW BARGUARD EXPOSES IT */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            BarGuard gives you data, not suspicion
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 580, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            Shift-based variance analysis compares exactly what should have been consumed during a bartender's shift against what was actually used. The numbers don't lie.
          </p>
          <div className="sbt-grid-2">
            {[
              { icon: '◈', title: 'Shift-based variance calculations', body: 'Run Happy Hour, Dinner, or Late Night separately. If one shift consistently runs 20% over expected on certain bottles, you have a pattern worth investigating.' },
              { icon: '⊕', title: 'Per-item variance with status flags', body: 'Every item is marked Normal, Warning, or Critical. Critical items show exactly how many ounces (or bottles) are unaccounted for.' },
              { icon: '◎', title: 'Revenue vs. expected usage comparison', body: 'See total shift revenue alongside expected spirit consumption. A high-revenue shift with high variance is a red flag.' },
              { icon: '✦', title: 'AI-written variance summary', body: 'After each calculation, BarGuard\'s AI writes a plain-English analysis — identifying the highest-risk items and likely cause categories.' },
              { icon: '⟳', title: 'Historical trends over time', body: 'Save every variance report. Compare the same shift week-over-week to see if a problem is getting worse or was isolated to a specific date.' },
              { icon: '⊘', title: 'Team audit log', body: 'The admin panel logs who submitted which inventory counts, who changed roles, and when — creating an accountability chain at every step.' },
            ].map((f) => (
              <div key={f.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '24px', display: 'flex', gap: 16, transition: 'border-color 0.2s' }}>
                <div style={{ width: 40, height: 40, minWidth: 40, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: 16, fontFamily: 'monospace' }}>{f.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 14 }}>{f.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT PROOF LOOKS LIKE */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '36px 40px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, marginBottom: 20, fontFamily: 'var(--font-montserrat)' }}>
              What a theft pattern looks like in BarGuard
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { item: 'Tito\'s Handmade Vodka', status: 'CRITICAL', variance: '+8.2 btl', pct: '+941%', shift: 'Late Night — Fri/Sat' },
                { item: 'Ketel One Vodka', status: 'CRITICAL', variance: '+3.5 btl', pct: '+420%', shift: 'Late Night — Fri/Sat' },
                { item: 'Don Julio Blanco', status: 'WARNING', variance: '+1.2 btl', pct: '+145%', shift: 'Dinner — Fri' },
              ].map((r) => (
                <div key={r.item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>{r.item}</p>
                    <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{r.shift}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', background: r.status === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: r.status === 'CRITICAL' ? '#f87171' : '#fbbf24', borderRadius: 6 }}>{r.status}</span>
                    <span style={{ color: '#f87171', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-montserrat)' }}>{r.variance}</span>
                    <span style={{ color: '#ef4444', fontSize: 12 }}>{r.pct}</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
              When the same bartender's shift shows the same bottles going critical week after week, that's not spillage — that's a conversation you need to have.
            </p>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="sbt-grid-2">
            {[
              { href: '/automated-inventory-system', label: 'Automated Inventory System', desc: 'Run counts and pull reports consistently — the foundation of any theft prevention program.' },
              { href: '/bar-profit-tracking', label: 'Bar Profit Tracking', desc: 'Track revenue, covers, and drink profitability alongside your variance data.' },
              { href: '/pricing', label: 'View Pricing', desc: 'Plans from $129/month — less than what one theft incident costs.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Real screenshots of shift variance reports and risk tables.' },
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
            Turn suspicion into data you can act on
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            The first shift variance report usually surfaces the problem clearly. See what yours shows — free for 14 days.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="sbt_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
