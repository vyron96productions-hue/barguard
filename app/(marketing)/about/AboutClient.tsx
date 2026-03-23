import Image from 'next/image'

export default function AboutClient() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <style>{`
        .about-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 80px;
          align-items: start;
        }
        .about-photo-col {
          position: sticky;
          top: 104px;
        }
        .about-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #f59e0b, transparent);
          margin: 28px 0;
        }
        @media (max-width: 860px) {
          .about-layout {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .about-photo-col {
            position: static;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .about-divider {
            margin: 28px auto;
          }
        }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      {/* Glow */}
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)'
      }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 28,
            fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b',
            letterSpacing: '0.08em', textTransform: 'uppercase' as const
          }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            Our Story
          </div>
          <h1 style={{
            fontFamily: 'var(--font-montserrat, sans-serif)',
            fontSize: 'clamp(36px, 6vw, 60px)',
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            margin: '0 auto',
            maxWidth: 720,
          }}>
            Why BarGuard Exists
          </h1>
        </section>

        {/* MAIN CONTENT */}
        <section style={{ paddingBottom: 120 }}>
          <div className="about-layout">

            {/* Photo column */}
            <div className="about-photo-col">
              <div style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid rgba(245,158,11,0.2)',
                boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 32px 80px rgba(0,0,0,0.5)',
                background: '#0f172a',
                aspectRatio: '3/4',
                maxWidth: 360,
                width: '100%',
              }}>
                <Image
                  src="/Headshot2.png"
                  alt="BarGuard founder"
                  width={360}
                  height={480}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              </div>

              {/* Tag below photo */}
              <div style={{
                marginTop: 20,
                padding: '12px 16px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 14,
                maxWidth: 360,
                width: '100%',
              }}>
                <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, margin: '0 0 2px', fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Founder, BarGuard</p>
                <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0, fontWeight: 500 }}>Hospitality Operator</p>
                <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Security · Bartending · Promoting · Club Owner</p>
              </div>
            </div>

            {/* Text column */}
            <div>
              <div className="about-divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Problem */}
                <div style={{ marginBottom: 36 }}>
                  <p style={{ fontSize: 20, lineHeight: 1.7, color: '#cbd5e1', fontWeight: 500, margin: '0 0 20px' }}>
                    Most bar owners are losing thousands every month and do not even realize where it is going.
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: '#64748b', margin: 0 }}>
                    It happens in small ways that add up fast. Over pouring. Missed comps. Inventory that does not match what was actually sold. By the end of the week, the numbers look close enough, but the profit is already gone.
                  </p>
                </div>

                {/* Credibility */}
                <div style={{ marginBottom: 36 }}>
                  {/* Callout block */}
                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '0 12px 12px 0',
                    marginBottom: 20,
                  }}>
                    <p style={{ fontSize: 17, lineHeight: 1.7, color: '#e2e8f0', fontWeight: 500, margin: 0, fontStyle: 'italic' }}>
                      I know this because I have lived it on the floor, behind the bar, and as an owner.
                    </p>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: '#64748b', margin: '0 0 16px' }}>
                    I have spent my entire adult life in the hospitality industry, from security and bartending to promoting and owning a nightclub. I have seen how hard it is to stay on top of inventory while running everything else, and how easy it is for losses to slip through without clear visibility.
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: '#64748b', margin: 0 }}>
                    The problem is not effort. It is the lack of real control.
                  </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, #1e293b, transparent)', marginBottom: 36 }} />

                {/* Solution */}
                <div style={{ marginBottom: 36 }}>
                  <p style={{ fontSize: 18, lineHeight: 1.7, color: '#94a3b8', fontWeight: 600, margin: '0 0 16px' }}>
                    BarGuard was built to change that.
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: '#64748b', margin: '0 0 16px' }}>
                    It gives you a clear, real time view of what is actually happening in your bar so you can catch losses early, tighten operations, and protect your margins without slowing your team down.
                  </p>
                  {/* Product bridge */}
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: '#475569', margin: 0, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                    BarGuard gives you real time control over your inventory so you can track every ounce, reduce loss, and protect your margins.
                  </p>
                </div>

                {/* Closing */}
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: '#64748b', margin: 0 }}>
                    This is not guesswork. This is not theory.<br />
                    This is built from real experience solving a problem that costs bar owners money every single day.
                  </p>
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/signup" data-gtm-event="cta_click" data-gtm-label="about_cta_start_trial" style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    background: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: 15,
                    borderRadius: 10,
                    textDecoration: 'none',
                    letterSpacing: '-0.2px',
                  }}>
                    Start Free Trial
                  </a>
                  <a href="/features" data-gtm-event="cta_click" data-gtm-label="about_cta_features" style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontWeight: 500,
                    fontSize: 15,
                    borderRadius: 10,
                    textDecoration: 'none',
                    border: '1px solid #1e293b',
                  }}>
                    See How It Works
                  </a>
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
