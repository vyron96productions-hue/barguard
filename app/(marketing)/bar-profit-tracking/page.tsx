import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bar Profit Tracking — See Where Every Dollar Goes',
  description: 'BarGuard tracks your bar\'s profit at the drink level — revenue, pour cost, margin, and expected vs actual usage — so you know exactly what\'s working.',
  alternates: { canonical: 'https://barguard.app/bar-profit-tracking' },
  openGraph: {
    title: 'Bar Profit Tracking — See Where Every Dollar Goes | BarGuard',
    description: 'Connect POS sales to inventory costs. Track drink profitability, shift revenue, and pour cost in real time. BarGuard is profit intelligence for bar owners.',
    url: 'https://barguard.app/bar-profit-tracking',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function BarProfitTrackingPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <style>{`
        .bpt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .bpt-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 768px) { .bpt-grid-2, .bpt-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 999, fontSize: 13, color: '#34d399', fontWeight: 600, marginBottom: 24 }}>
            Bar Profit Tracking
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Bar Profit Tracking<br />
            <span style={{ color: '#f59e0b' }}>That Shows You Where Every Dollar Goes</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Most bar owners know their revenue. Very few know their <em>actual</em> profit after pour cost, waste, and variance. BarGuard connects your POS sales to your inventory costs and shows you the real number — by drink, by shift, by week.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bpt_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See Screenshots
            </Link>
          </div>
        </section>

        {/* WHAT BAR PROFIT TRACKING MEANS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Revenue isn't profit — and most bars don't know the difference
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
            Your POS shows $18,400 in sales this week. But what did it cost? Without tracking pour cost, inventory variance, and ingredient costs per drink — you don't actually know your margin.
          </p>
          <div className="bpt-grid-3">
            {[
              { icon: '$', title: 'Revenue tracking', body: 'BarGuard pulls gross sales from your POS — by item, by shift, by period. Updated every 5 minutes automatically.' },
              { icon: '÷', title: 'Pour cost per drink', body: 'Link your recipes and ingredient costs. BarGuard calculates the exact cost of every drink you sell and your margin on each one.' },
              { icon: '◈', title: 'Variance-adjusted profit', body: 'Subtract actual variance losses from your gross margin to see your true net profit — not just your theoretical target.' },
            ].map((m) => (
              <div key={m.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: 18, fontFamily: 'monospace', margin: '0 auto 16px' }}>{m.icon}</div>
                <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 8, fontSize: 15 }}>{m.title}</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            Every profit metric your bar needs
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 520, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            From drink-level profitability to shift-level revenue, BarGuard surfaces the numbers that drive real decisions.
          </p>
          <div className="bpt-grid-2">
            {[
              { icon: '◐', title: 'Drink profit summaries', body: 'See gross revenue, estimated ingredient cost, profit margin %, and quantity sold — for every drink on your menu, every period.' },
              { icon: '⊕', title: 'Shift revenue analytics', body: 'Total revenue, transaction count, avg check, and covers per shift. Compare Happy Hour vs Dinner vs Late Night side by side.' },
              { icon: '⟳', title: 'Expense tracking', body: 'Log and categorize non-inventory expenses — equipment, marketing, maintenance. See your full P&L in one place.' },
              { icon: '✦', title: 'AI variance summaries', body: 'After each variance calculation, BarGuard writes a plain-English profit analysis: your risk items, their cost impact, and recommended actions.' },
              { icon: '◎', title: 'Reorder cost management', body: 'Know what you spend with each vendor. Link purchase invoices to inventory items and track cost trends over time.' },
              { icon: '⊘', title: 'Health score dashboard', body: 'A single 0–100 health score based on your critical and warning items. Know at a glance whether this week looks better or worse than last.' },
            ].map((f) => (
              <div key={f.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '24px', display: 'flex', gap: 16, transition: 'border-color 0.2s' }}>
                <div style={{ width: 40, height: 40, minWidth: 40, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: 16, fontFamily: 'monospace' }}>{f.icon}</div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 14 }}>{f.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT BAR OWNERS FIND */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, marginBottom: 24, fontFamily: 'var(--font-montserrat)' }}>
            What bar owners discover when they start tracking profit properly
          </h2>
          <div className="bpt-grid-3">
            {[
              { find: 'Their highest-revenue shift isn\'t always the most profitable', because: 'Late Night brings in cash but variance spikes — net profit can be lower than Dinner.' },
              { find: 'Their most popular cocktail has the worst margin', because: 'Complex recipes with expensive spirits look good on the menu but barely break even after pour cost.' },
              { find: 'One vendor is raising prices without notice', because: 'Linking invoices to items shows cost drift on specific products over time.' },
            ].map((d) => (
              <div key={d.find} style={{ background: '#0f172a', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '22px' }}>
                <p style={{ fontWeight: 600, color: '#34d399', fontSize: 13, marginBottom: 10 }}>DISCOVERY</p>
                <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>{d.find}</p>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>Because: {d.because}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="bpt-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'The full BarGuard platform — inventory, variance, and profit in one place.' },
              { href: '/reduce-liquor-cost', label: 'Reduce Liquor Cost', desc: 'Bring your pour cost in line and protect your margins long-term.' },
              { href: '/pricing', label: 'View Pricing', desc: 'All profit tracking features included from $129/month.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Screenshots of profit reports, shift analytics, and expense tracking.' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: 'block', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '18px 20px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{l.label} →</p>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{l.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(245,158,11,0.04))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 24, padding: '56px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Know your real profit — not just your revenue
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            Start with your first variance report and drink profit summary. The numbers will change how you run your bar.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bpt_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
