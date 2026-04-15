import type { Metadata } from 'next'
import Image from 'next/image'
import DemoVideo from '@/components/DemoVideo'

export const metadata: Metadata = {
  title: 'BarGuard — AI Bar Inventory Loss Detection Software',
  description: 'Stop losing money to over-pouring, shrinkage, and theft. BarGuard tracks your bar inventory, syncs with your POS, and shows exactly where product disappears.',
  alternates: { canonical: 'https://barguard.app' },
  openGraph: {
    title: 'BarGuard — AI Bar Inventory Loss Detection Software',
    description: 'Stop losing money to over-pouring, shrinkage, and theft. BarGuard tracks your bar inventory, syncs with your POS, and shows exactly where product disappears.',
    url: 'https://barguard.app',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/Barguard_web_banner.webp', width: 1200, height: 630, alt: 'BarGuard — AI Bar Inventory Loss Detection Software' }],
  },
}

export default function HomePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BarGuard',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://barguard.app',
    description: 'AI-powered bar inventory loss detection. Track shrinkage, over-pouring, and stock discrepancies before they cost you thousands.',
    screenshot: 'https://barguard.app/images/Dashboard.png',
    featureList: 'AI invoice scanning, Variance reports, POS integration with Square and Clover, Smart reorder alerts, Profit intelligence, Stock level tracking, Sales analytics',
    offers: [
      { '@type': 'Offer', name: 'Basic', price: '129', priceCurrency: 'USD', url: 'https://barguard.app/pricing', description: 'Core inventory workflow, AI invoice scanning, variance reports' },
      { '@type': 'Offer', name: 'Pro', price: '249', priceCurrency: 'USD', url: 'https://barguard.app/pricing', description: 'Full POS integration, multi-user logins, vendor management, automated reorder' },
      { '@type': 'Offer', name: 'Enterprise', price: '449', priceCurrency: 'USD', url: 'https://barguard.app/pricing', description: 'Multi-location, priority support, custom onboarding' },
    ],
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', overflow: 'hidden' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .cta-card { padding: 60px 48px; }
        .hero-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px; }
        .hero-buttons a { width: auto; }

        .feature-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 18px;
          padding: 28px 28px 32px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow: 0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.15), 0 0 24px rgba(245,158,11,0.08);
        }
        .feature-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; font-size: 18px; color: #f59e0b;
          font-family: monospace;
          transition: transform 0.3s ease, background 0.25s ease, border-color 0.25s ease;
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.15) rotate(-4deg);
          background: rgba(245,158,11,0.18);
          border-color: rgba(245,158,11,0.4);
        }

        .blog-teaser-card {
          display: block; background: #0f172a; border: 1px solid #1e293b;
          border-radius: 16px; padding: 24px; text-decoration: none;
          transition: border-color 0.2s;
        }
        .blog-teaser-card:hover { border-color: rgba(245,158,11,0.35); }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; gap: 40px; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .cta-card { padding: 36px 20px; }
          .hero-buttons a { width: 100%; justify-content: center; box-sizing: border-box; }
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

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          BarGuard — AI Bar Inventory Loss Detection Software
        </h1>
        <Image
          src="/Barguard_web_banner.webp"
          alt="BarGuard — Stop losing money to invisible inventory shrinkage"
          width={1920}
          height={800}
          priority
          fetchPriority="high"
          sizes="100vw"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {/* VIDEO — right under banner */}
        <div style={{ padding: '48px 24px 0', maxWidth: 880, margin: '0 auto' }}>
          <DemoVideo />
        </div>

        <div style={{ padding: '48px 24px 80px' }}>

        {/* Integration strip */}
        <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <p style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 700, color: '#f1f5f9', maxWidth: 600, lineHeight: 1.45, margin: 0, fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.3px' }}>
            No need to change your setup — BarGuard connects directly with Square, Clover, and Toast.<br />
            <span style={{ color: '#f59e0b' }}>More integrations coming soon.</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Image
              src="/square-logo.png"
              alt="Square"
              width={120}
              height={48}
              style={{ height: 48, width: 'auto', filter: 'invert(1)', opacity: 0.85 }}
            />
            <span style={{ width: 1, height: 36, background: '#1e293b' }} />
            <img
              src="/clover-logo.svg"
              alt="Clover"
              width={120}
              height={52}
              style={{ height: 52, width: 'auto', opacity: 0.85 }}
            />
            <span style={{ width: 1, height: 36, background: '#1e293b' }} />
            <Image
              src="/toast-logo.png"
              alt="Toast POS"
              width={120}
              height={48}
              style={{ height: 48, width: 'auto', opacity: 0.85 }}
            />
          </div>
        </div>

        <div className="hero-buttons">
          <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="homepage_hero_start_trial" style={{ padding: '14px 28px', fontSize: 15 }}>
            Start Free Trial
            <span style={{ fontSize: 16 }}>→</span>
          </a>
          <a href="/how-it-works" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="homepage_hero_screenshots" style={{ padding: '14px 28px', fontSize: 15 }}>
            See it in action
          </a>
          <a href="/pricing" data-gtm-event="cta_click" data-gtm-label="homepage_hero_view_pricing" style={{ padding: '14px 28px', fontSize: 15, color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            View Pricing
          </a>
        </div>

        {/* App mockup */}
        <div style={{
          maxWidth: 860, margin: '0 auto',
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 20, padding: 2, overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)',
        }}>
          {/* Browser chrome */}
          <div style={{ background: '#0a1628', borderRadius: '18px 18px 0 0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1e293b' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
            <span style={{ flex: 1, background: '#1e293b', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#475569', textAlign: 'center' as const }}>barguard.app/dashboard</span>
          </div>
          {/* Dashboard mockup content */}
          <div style={{ padding: '24px 24px 20px', background: '#080e1a' }}>
            {/* KPI row */}
            <div className="kpi-grid">
              {[
                { label: 'Critical Items', value: '3', color: '#ef4444' },
                { label: 'Est. Loss', value: '$847', color: '#ef4444' },
                { label: 'Health Score', value: '72', color: '#f59e0b' },
                { label: 'Items Tracked', value: '48', color: '#22c55e' },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>{kpi.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: kpi.color, fontFamily: 'monospace' }}>{kpi.value}</p>
                </div>
              ))}
            </div>
            {/* Chart bar mockup */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Variance by Item</span>
                <span style={{ fontSize: 10, color: '#334155', background: '#1e293b', padding: '3px 8px', borderRadius: 4 }}>Last 7 days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                {[40, 65, 30, 80, 45, 90, 55, 70, 35, 85, 50, 60].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i === 5 || i === 9 ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.2)', borderRadius: '3px 3px 0 0', height: `${h}%` }} />
                ))}
              </div>
            </div>
            {/* Risk table mockup */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Risk Items</div>
              {[
                { name: 'Grey Goose Vodka', variance: '+18.3 oz', status: 'critical' },
                { name: 'Bacardi Silver Rum', variance: '+12.1 oz', status: 'critical' },
                { name: 'Bulleit Bourbon', variance: '+7.8 oz', status: 'warning' },
              ].map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'critical' ? '#ef4444' : '#f59e0b', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: item.status === 'critical' ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>{item.variance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', padding: '32px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 1120, margin: '0 auto' }}>
          {[
            { value: 'Square + Clover', label: 'POS integrations, more coming' },
            { value: 'Easy Setup', label: 'No technical skills needed' },
            { value: '14 days', label: 'Free trial, no card needed' },
            { value: 'Cancel anytime', label: 'No long-term contracts' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '8px 0' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-montserrat)', letterSpacing: '-1px', marginBottom: 4 }}>{stat.value}</p>
              <p style={{ fontSize: 13, color: '#475569' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 64 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 16 }}>Features</p>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(24px, 3vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>
            Everything you need to<br /><em style={{ color: '#f59e0b' }}>protect your inventory</em>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>Built specifically for bars and restaurants. Not a generic inventory tool.</p>
        </div>
        <div className="features-grid">

          {/* Real-Time Variance Tracking */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>Real-Time Variance Tracking</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Compare what was poured vs. what was sold. Instantly spot discrepancies by item, shift, or date range.</p>
          </div>

          {/* AI-Powered Loss Detection */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v1.5c1.2.7 2 2 2 3.5a4 4 0 0 1-8 0c0-1.5.8-2.8 2-3.5V16H8a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z" />
                <circle cx="12" cy="12" r="1" fill="#f59e0b" stroke="none" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>AI-Powered Loss Detection</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Claude AI analyzes your patterns and surfaces the items most likely to be over-poured or going missing.</p>
          </div>

          {/* Invoice Scanning */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
                <path d="M17 17l2 2 4-4" strokeWidth="2" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>Invoice Scanning</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Photograph or upload any invoice — AI extracts line items automatically. No manual data entry.</p>
          </div>

          {/* Loss Reports */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>Loss Reports</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Detailed breakdown of every variance event. Export and share with your team or accountant.</p>
          </div>

          {/* Smart Reorder Alerts */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="12" y1="2" x2="12" y2="4" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>Smart Reorder Alerts</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Never run out of top sellers. Automated alerts when items hit your reorder threshold.</p>
          </div>

          {/* POS Integration */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M7 8h2m2 0h2m2 0h2" strokeWidth="2" />
                <path d="M7 11h4" strokeWidth="2" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>POS Integration</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Connect your Square or other POS system to auto-import sales data. Zero manual entry.</p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', background: 'rgba(15,23,42,0.5)', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 64 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 16 }}>How It Works</p>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(24px, 3vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800 }}>
              Up and running in <em style={{ color: '#f59e0b' }}>minutes</em>
            </h2>
          </div>
          <div className="steps-grid">
            {[
              { step: '01', title: 'Add Your Inventory', desc: 'Enter your bottles, kegs, and packs. Set par levels and cost prices. The more items you carry, the longer it takes — but you only do it once.' },
              { step: '02', title: 'Count & Import', desc: 'Photograph invoices to auto-import purchases. Do stock counts before and after each shift.' },
              { step: '03', title: 'Catch the Losses', desc: "Run calculations and let BarGuard's AI flag what doesn't add up. Take action before it gets worse." },
            ].map((step) => (
              <div key={step.step} style={{ textAlign: 'center' as const, padding: '0 16px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 56 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 16 }}>Why BarGuard</p>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(24px, 3vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>
              Stop guessing.<br /><em style={{ color: '#f59e0b' }}>Start knowing.</em>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 460, margin: '0 auto' }}>Most bars rely on tools never built for this. Here's the difference.</p>
          </div>

          <style>{`
            .comparison-table { width: 100%; border-collapse: separate; border-spacing: 0; }
            .comparison-table th, .comparison-table td { padding: 14px 20px; text-align: left; border-bottom: 1px solid #1e293b; }
            .comparison-table th { font-size: 13px; font-weight: 700; padding-top: 20px; padding-bottom: 20px; }
            .comparison-table td { font-size: 14px; color: #94a3b8; line-height: 1.5; vertical-align: top; }
            .comparison-table tr:last-child td { border-bottom: none; }
            .col-barguard td:nth-child(3), .col-barguard th:nth-child(3) { background: rgba(245,158,11,0.04); }
            @media (max-width: 640px) {
              .comparison-table th, .comparison-table td { padding: 12px 12px; font-size: 13px; }
            }
          `}</style>

          <div style={{ borderRadius: 18, border: '1px solid #1e293b', overflow: 'hidden', background: '#0f172a' }}>
            <table className="comparison-table col-barguard">
              <thead>
                <tr style={{ background: '#080e1a' }}>
                  <th style={{ color: '#475569', width: '28%', borderBottom: '1px solid #1e293b' }}>Feature</th>
                  <th style={{ color: '#64748b', width: '24%', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>📊</span> Spreadsheets
                    </span>
                  </th>
                  <th style={{ color: '#64748b', width: '24%', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🖥️</span> POS Only
                    </span>
                  </th>
                  <th style={{ width: '24%', borderBottom: '1px solid rgba(245,158,11,0.3)', borderLeft: '1px solid rgba(245,158,11,0.15)', borderRight: '1px solid rgba(245,158,11,0.15)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                      <Image src="/barguard_icon.png" alt="" width={18} height={18} style={{ height: 18, width: 'auto' }} /> BarGuard
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Variance detection',
                    spreadsheet: 'Manual math — errors guaranteed',
                    pos: 'Sales only — no inventory side',
                    barguard: 'Automatic — poured vs. sold, every item',
                    barguardGood: true,
                  },
                  {
                    feature: 'Loss alerts',
                    spreadsheet: 'None — you find it when it\'s too late',
                    pos: 'None',
                    barguard: 'Real-time flags when something looks off',
                    barguardGood: true,
                  },
                  {
                    feature: 'Invoice entry',
                    spreadsheet: 'Typed in by hand',
                    pos: 'Not supported',
                    barguard: 'Scan a photo — AI fills it in',
                    barguardGood: true,
                  },
                  {
                    feature: 'AI insights',
                    spreadsheet: 'None',
                    pos: 'None',
                    barguard: 'Flags patterns, suggests fixes',
                    barguardGood: true,
                  },
                  {
                    feature: 'Stock counts',
                    spreadsheet: 'Paper or manual entry',
                    pos: 'Limited or unavailable',
                    barguard: 'Built-in count workflow, before & after shift',
                    barguardGood: true,
                  },
                  {
                    feature: 'Reorder alerts',
                    spreadsheet: 'None — you notice when you run out',
                    pos: 'Basic low-stock only',
                    barguard: 'Smart alerts at your set thresholds',
                    barguardGood: true,
                  },
                  {
                    feature: 'Time to set up',
                    spreadsheet: 'Hours of building formulas',
                    pos: 'Already have it',
                    barguard: '30 minutes or less',
                    barguardGood: true,
                  },
                  {
                    feature: 'Built for bars',
                    spreadsheet: '✗',
                    pos: '✗',
                    barguard: '✓  Spirits, kegs, pack sizes, modifiers',
                    barguardGood: true,
                  },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td style={{ color: '#cbd5e1', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ color: '#475569' }}>{row.spreadsheet}</td>
                    <td style={{ color: '#475569' }}>{row.pos}</td>
                    <td style={{ color: '#22c55e', fontWeight: 500, borderLeft: '1px solid rgba(245,158,11,0.1)', borderRight: '1px solid rgba(245,158,11,0.1)' }}>{row.barguard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center' as const, marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="homepage_comparison_cta" style={{ padding: '14px 32px', fontSize: 15 }}>
              Try BarGuard Free for 14 Days →
            </a>
            <a href="/features" data-gtm-event="cta_click" data-gtm-label="homepage_comparison_features" style={{ padding: '14px 32px', fontSize: 15, color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              See all features
            </a>
          </div>
        </div>
      </section>

      {/* PRICING CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', textAlign: 'center' as const }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 20 }}>Pricing</p>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(24px, 3vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 20 }}>
            Simple, <em style={{ color: '#f59e0b' }}>transparent</em> pricing
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.65 }}>
            Plans starting at $129/month. Try free for 14 days — no credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="/pricing" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="homepage_pricing_see_plans" style={{ padding: '14px 28px', fontSize: 15 }}>
              See All Plans
            </a>
            <a href="/signup" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="homepage_pricing_start_trial" style={{ padding: '14px 28px', fontSize: 15 }}>
              Start Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* BLOG TEASER */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>From the Blog</p>
              <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800 }}>Bar operations & loss prevention guides</h2>
            </div>
            <a href="/blog" data-gtm-event="cta_click" data-gtm-label="homepage_blog_all_articles" style={{ fontSize: 14, color: '#f59e0b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const }}>
              All articles →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="steps-grid">
            {[
              { href: '/blog/bar-shrinkage-how-much-are-you-losing', title: 'How Much Is Your Bar Losing to Shrinkage?', excerpt: 'The average bar loses 20–25% of inventory annually. Here\'s how to calculate your number and stop it.', tag: 'Inventory' },
              { href: '/blog/over-pouring-bar-losses', title: 'Over-Pouring Is Costing More Than You Think', excerpt: 'A quarter ounce over per drink adds up to $50,000+ per year for a busy bar. Here\'s the math.', tag: 'Loss Prevention' },
              { href: '/blog/bartender-theft-signs-prevention', title: 'Bartender Theft: How to Know If It\'s Happening', excerpt: 'Internal theft causes 35–40% of bar losses. Learn the warning signs and how to catch it with data.', tag: 'Loss Prevention' },
            ].map(post => (
              <a key={post.href} href={post.href} className="blog-teaser-card">
                <span style={{ display: 'inline-block', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: 100, marginBottom: 12 }}>{post.tag}</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, marginBottom: 10 }}>{post.title}</p>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{post.excerpt}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', borderTop: '1px solid #1e293b' }}>
        <div className="cta-card" style={{ maxWidth: 760, margin: '0 auto', background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 24, textAlign: 'center' as const, boxShadow: '0 0 60px rgba(245,158,11,0.06)' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(22px, 2.8vw, 36px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 18 }}>
            Ready to stop the <em style={{ color: '#f59e0b' }}>bleeding?</em>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.65, maxWidth: 480, margin: '0 auto 36px' }}>
            Start your free 14-day trial and find out exactly where your inventory is going. No credit card, no commitment.
          </p>
          <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="homepage_final_cta" style={{ padding: '16px 36px', fontSize: 16 }}>
            Get Started Free — 14-Day Trial
            <span>→</span>
          </a>
          <p style={{ fontSize: 15, color: '#cbd5e1', marginTop: 16 }}>No credit card required · Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
