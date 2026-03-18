export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', overflow: 'hidden' }}>
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
        <img
          src="/Barguard_web_banner.webp"
          alt="BarGuard — Stop losing money to invisible inventory shrinkage"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div style={{ padding: '48px 24px 80px' }}>

        <div className="hero-buttons">
          <a href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: '#f59e0b', color: '#020817',
            fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none',
            boxShadow: '0 0 30px rgba(245,158,11,0.25)'
          }}>
            Start Free Trial
            <span style={{ fontSize: 16 }}>→</span>
          </a>
          <a href="/pricing" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: 'transparent', color: '#94a3b8',
            fontWeight: 500, fontSize: 15, borderRadius: 12, textDecoration: 'none',
            border: '1px solid #1e293b'
          }}>
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
            { value: '$2,400+', label: 'Average monthly savings' },
            { value: 'Easy Setup', label: 'No technical skills needed' },
            { value: '14 days', label: 'Free trial, no card needed' },
            { value: '99.9%', label: 'Uptime guaranteed' },
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
          {[
            {
              icon: '◈',
              title: 'Real-Time Variance Tracking',
              desc: 'Compare what was poured vs. what was sold. Instantly spot discrepancies by item, shift, or date range.'
            },
            {
              icon: '◑',
              title: 'AI-Powered Loss Detection',
              desc: 'Claude AI analyzes your patterns and surfaces the items most likely to be over-poured or going missing.'
            },
            {
              icon: '⊡',
              title: 'Invoice Scanning',
              desc: 'Photograph or upload any invoice — AI extracts line items automatically. No manual data entry.'
            },
            {
              icon: '◐',
              title: 'Loss Reports',
              desc: 'Detailed breakdown of every variance event. Export and share with your team or accountant.'
            },
            {
              icon: '⟳',
              title: 'Smart Reorder Alerts',
              desc: 'Never run out of top sellers. Automated alerts when items hit your reorder threshold.'
            },
            {
              icon: '⇋',
              title: 'POS Integration',
              desc: 'Connect your Square or other POS system to auto-import sales data. Zero manual entry.'
            },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
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
              { step: '01', title: 'Add Your Inventory', desc: 'Enter your bottles, kegs, and packs. Set par levels and cost prices. Takes about 15 minutes.' },
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

      {/* PRICING CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', textAlign: 'center' as const }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 20 }}>Pricing</p>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(24px, 3vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 20 }}>
            Simple, <em style={{ color: '#f59e0b' }}>transparent</em> pricing
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.65 }}>
            Plans starting at $99/month. Try free for 14 days — no credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="/pricing" style={{ padding: '14px 28px', background: '#f59e0b', color: '#020817', fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 30px rgba(245,158,11,0.2)' }}>
              See All Plans
            </a>
            <a href="/signup" style={{ padding: '14px 28px', background: 'transparent', color: '#94a3b8', fontWeight: 500, fontSize: 15, borderRadius: 12, textDecoration: 'none', border: '1px solid #1e293b' }}>
              Start Free Trial
            </a>
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
            Most bars see ROI in the first week. Start your free 14-day trial and find out exactly where your inventory is going.
          </p>
          <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', background: '#f59e0b', color: '#020817', fontWeight: 700, fontSize: 16, borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 40px rgba(245,158,11,0.3)' }}>
            Get Started Free — 14-Day Trial
            <span>→</span>
          </a>
          <p style={{ fontSize: 13, color: '#334155', marginTop: 16 }}>No credit card required · Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
