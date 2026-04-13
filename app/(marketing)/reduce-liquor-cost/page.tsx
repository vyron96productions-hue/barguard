import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Reduce Liquor Cost Without Cutting Corners | BarGuard',
  description: 'BarGuard shows you exactly what\'s driving your pour cost above target. Catch over-pouring, shrinkage, and waste — and reduce liquor cost in 30 days.',
  alternates: { canonical: 'https://barguard.app/reduce-liquor-cost' },
  openGraph: {
    title: 'Reduce Liquor Cost Without Cutting Corners | BarGuard',
    description: 'Stop guessing why your liquor cost is high. BarGuard tracks variance by item and shift — so you find the problem and fix it fast.',
    url: 'https://barguard.app/reduce-liquor-cost',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function ReduceLiquorCostPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <style>{`
        .rlc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .rlc-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 768px) { .rlc-grid-2, .rlc-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Reduce Liquor Cost
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            Reduce Your Liquor Cost<br />
            <span style={{ color: '#f59e0b' }}>Without Cutting Corners</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            The average bar runs a liquor cost of <strong style={{ color: '#f1f5f9' }}>22–28%</strong>. Most should be at 18–22%. That gap isn't a pricing problem — it's a <em>tracking</em> problem. BarGuard finds exactly what's driving it up.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="rlc_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See How It Works
            </Link>
          </div>
        </section>

        {/* REASONS LIQUOR COST IS HIGH */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
            Why your liquor cost is higher than it should be
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 15, lineHeight: 1.7, maxWidth: 640 }}>
            Most bar owners assume the problem is pricing. Usually it's not. High pour cost almost always traces back to one of these four categories:
          </p>
          <div className="rlc-grid-2">
            {[
              {
                icon: '⚠', color: '#f87171',
                title: 'Over-pouring',
                body: 'Bartenders who free-pour add 10–30% more than the recipe calls for. Without oz-level tracking, you can\'t see it until the bottle is gone and the cost is already absorbed.',
              },
              {
                icon: '◌', color: '#fb923c',
                title: 'Shrinkage and "spillage"',
                body: 'Drinks made wrong, poured out, or intentionally given away create losses that look identical to legitimate usage in your POS reports.',
              },
              {
                icon: '⊘', color: '#a78bfa',
                title: 'Recipe drift',
                body: 'Your menu says 1.5 oz. Your staff pours 2.0 oz. The cost of that 0.5 oz extra, multiplied by every drink sold, is where margins go to die.',
              },
              {
                icon: '◎', color: '#60a5fa',
                title: 'Untracked comp and waste',
                body: 'Manager comps, spilled drinks, and testing new recipes all consume product. If they\'re not logged, they show up as unexplained variance.',
              },
            ].map((r) => (
              <div key={r.title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '26px', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: r.color, fontSize: 18, fontFamily: 'monospace' }}>{r.icon}</span>
                  <span style={{ fontWeight: 700, color: r.color, fontSize: 15 }}>{r.title}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW BARGUARD FIXES IT */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            How BarGuard reduces your liquor cost
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 560, margin: '0 auto 36px', fontSize: 15, lineHeight: 1.7 }}>
            BarGuard doesn't just tell you your cost is high — it tells you <em>why</em> it's high and which items to address first.
          </p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '01', t: 'Link recipes to every drink on your menu', d: 'Set the exact pour for each spirit, modifier, and ingredient. BarGuard uses these recipes to calculate expected usage from your POS data.' },
              { n: '02', t: 'Count your bottles at shift change', d: 'Run a quick count before and after a shift. BarGuard calculates how much should have been consumed vs. how much was actually used.' },
              { n: '03', t: 'Identify the over-poured bottles by name', d: 'The variance report doesn\'t say "high pour cost." It says "Tito\'s Vodka: +4.7 bottles variance — Critical." You know exactly where to start.' },
              { n: '04', t: 'Track the change over time', d: 'Re-run reports after corrective action. See if variance on specific items is decreasing. Hold staff accountable with data, not guesses.' },
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

        {/* NUMBERS */}
        <section style={{ marginBottom: 80 }}>
          <div className="rlc-grid-3">
            {[
              { stat: '3–5%', label: 'typical pour cost reduction', sub: 'For a $1M revenue bar, that\'s $30,000–$50,000/year back.' },
              { stat: '30 days', label: 'to see measurable results', sub: 'First variance report usually surfaces the biggest problem item within a week.' },
              { stat: '$129/mo', label: 'starting price', sub: 'Less than the cost of one over-poured bottle per day.' },
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
          <div className="rlc-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'The complete BarGuard platform — tracking, reporting, and analytics.' },
              { href: '/stop-bartender-theft', label: 'Stop Bartender Theft', desc: 'When variance is too high to be over-pouring alone, here\'s what to look for.' },
              { href: '/pricing', label: 'View Pricing', desc: 'Plans from $129/month. ROI typically hits week one.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'See real screenshots of variance reports and pour cost analytics.' },
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
            Find out what's driving your liquor cost up
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            Run your first variance report in under 30 minutes. See exactly which bottles are over their expected usage.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="rlc_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
