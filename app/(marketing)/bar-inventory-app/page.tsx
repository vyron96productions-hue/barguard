import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bar Inventory App — Real-Time Tracking on Any Device',
  description: 'BarGuard is the bar inventory app that syncs with your POS every 5 minutes, auto-categorizes items, and runs variance reports from your phone or tablet.',
  alternates: { canonical: 'https://barguard.app/bar-inventory-app' },
  openGraph: {
    title: 'Bar Inventory App — Real-Time Tracking on Any Device | BarGuard',
    description: 'Run inventory counts, sync POS sales, and check variance reports from any device. BarGuard works in your browser — no download required.',
    url: 'https://barguard.app/bar-inventory-app',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function BarInventoryAppPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f1f5f9' }}>
      <style>{`
        .bia-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .bia-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .bia-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; transition: border-color 0.2s; }
        .bia-card:hover { border-color: rgba(245,158,11,0.35); }
        @media (max-width: 768px) { .bia-grid-2, .bia-grid-3 { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '80px 0 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 999, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>
            Bar Inventory App
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.5px' }}>
            The Bar Inventory App<br />
            <span style={{ color: '#f59e0b' }}>That Works While You Sleep</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#94a3b8', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.7 }}>
            BarGuard runs in your browser on any device — phone, tablet, or desktop. Your POS syncs every 5 minutes automatically. No app store. No install. Just open it and your data is there.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bia_hero_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start Free Trial →
            </a>
            <Link href="/how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }}>
              See It in Action
            </Link>
          </div>
        </section>

        {/* HOW AUTO-SYNC WORKS */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '40px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-montserrat)' }}>
              Your sales sync automatically — no manual import
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 15, lineHeight: 1.7, maxWidth: 640 }}>
              Connect your POS once. BarGuard pulls sales every 5 minutes via Vercel Cron — including when you visit the sales page mid-shift, which triggers an instant sync for today's data.
            </p>
            <div className="bia-grid-3">
              {[
                { pos: 'Square', desc: 'OAuth connection. Full sales history + real-time sync.' },
                { pos: 'Toast', desc: 'Credential-based API. Auto-refreshes tokens. Menu items auto-created on first sync.' },
                { pos: 'Clover', desc: 'OAuth flow. Syncs modifiers, quantities, and check-level data.' },
              ].map((p) => (
                <div key={p.pos} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 6, fontSize: 15 }}>{p.pos}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 12, textAlign: 'center', fontFamily: 'var(--font-montserrat)' }}>
            Everything a bar manager needs in one app
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 520, margin: '0 auto 36px', fontSize: 15 }}>
            Built for the floor, not a spreadsheet power user.
          </p>
          <div className="bia-grid-2">
            {[
              { icon: '◈', title: 'Count Now — mobile counting screen', body: 'Open on your phone, filter by category, and tap through each item. Saves to the database as you go.' },
              { icon: '⟳', title: 'AI invoice scanning', body: 'Photograph your paper invoice. AI reads every line item and matches it to your inventory automatically.' },
              { icon: '◎', title: 'Bottle scan (partial level detection)', body: 'Scan a bottle with your phone camera. BarGuard estimates the remaining ounces from the fill level.' },
              { icon: '✦', title: 'Shift-based variance', body: 'Select Happy Hour, Dinner, or Late Night. One click runs the calculation for that time window.' },
              { icon: '⊕', title: 'Reorder alerts', body: 'Set a reorder threshold per item. BarGuard flags when stock hits critical levels so you never run out mid-service.' },
              { icon: '⊘', title: 'Team access controls', body: 'Give managers inventory access. Give bartenders drink library access only. Role-based permissions built in.' },
            ].map((f) => (
              <div key={f.title} className="bia-card" style={{ display: 'flex', gap: 16 }}>
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
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 28, fontFamily: 'var(--font-montserrat)' }}>
            What makes BarGuard different from other apps
          </h2>
          <div className="bia-grid-2">
            {[
              { bad: 'Other apps require a tablet at the bar', good: 'BarGuard works on any device with a browser' },
              { bad: 'You manually upload a CSV every week', good: 'POS syncs every 5 minutes with no action required' },
              { bad: 'Counting happens in isolation from sales', good: 'Every count is compared against actual POS sales data' },
              { bad: 'Reports are static and generic', good: 'AI writes a custom summary of your specific risk items' },
            ].map((c) => (
              <div key={c.bad} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>✗  {c.bad}</p>
                <p style={{ fontSize: 13, color: '#34d399' }}>✓  {c.good}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ marginBottom: 80 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</h3>
          <div className="bia-grid-2">
            {[
              { href: '/bar-inventory-software', label: 'Bar Inventory Software', desc: 'The complete guide to how BarGuard tracks your inventory end-to-end.' },
              { href: '/automated-inventory-system', label: 'Automated Inventory System', desc: 'How BarGuard eliminates manual counting and keeps data current automatically.' },
              { href: '/pricing', label: 'View Pricing', desc: 'Plans from $129/month. No annual commitment required.' },
              { href: '/how-it-works', label: 'How It Works', desc: 'Real screenshots of the app — counts, reports, and analytics.' },
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
            Open BarGuard from your phone right now
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 460, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            No download. No install. Your full inventory management platform loads in any browser. Start in under 5 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="bia_bottom_trial" style={{ padding: '14px 32px', fontSize: 15 }}>
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
