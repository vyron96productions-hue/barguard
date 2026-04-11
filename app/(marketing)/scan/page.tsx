import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import DemoVideo from '@/components/DemoVideo'

export const metadata: Metadata = {
  title: 'Stop Bar Loss Now — BarGuard',
  description: "Your bar is losing money every night to overpouring, waste, and missing inventory. BarGuard shows you exactly where it's happening.",
  alternates: { canonical: 'https://barguard.app/scan' },
  openGraph: { url: 'https://barguard.app/scan' },
}

export default function ScanPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', color: '#f8fafc' }}>
      <style>{`
        .scan-container { max-width: 860px; margin: 0 auto; padding: 0 20px; }

        /* ── Hero ── */
        .hero-section { padding: 48px 20px 0; text-align: center; }
        .hero-eyebrow {
          display: inline-block;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 100px; margin-bottom: 20px;
        }
        .hero-headline {
          font-size: clamp(28px, 5.5vw, 56px);
          font-weight: 900; line-height: 1.1;
          letter-spacing: -0.02em; margin-bottom: 16px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .hero-headline .accent-red { color: #ef4444; }
        .hero-sub {
          font-size: clamp(15px, 2.2vw, 18px);
          color: #94a3b8; line-height: 1.55;
          max-width: 540px; margin: 0 auto 28px; font-weight: 400;
        }

        /* ── Proof Card (inside hero) ── */
        .proof-card {
          max-width: 700px; margin: 0 auto 28px;
          background: #0f172a; border: 1px solid #1e293b;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1);
        }
        .proof-card-header {
          padding: 12px 18px; border-bottom: 1px solid #1e293b;
          display: flex; align-items: center; gap: 8px;
        }
        .proof-dot { width: 9px; height: 9px; border-radius: 50%; }
        .proof-title-text { font-size: 12px; font-weight: 600; color: #475569; margin-left: 4px; }
        .proof-metrics-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid #1e293b;
        }
        .proof-metric { padding: 16px 18px; border-right: 1px solid #1e293b; }
        .proof-metric:last-child { border-right: none; }
        .proof-metric-label { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
        .proof-metric-value { font-size: clamp(20px, 3vw, 28px); font-weight: 800; line-height: 1; font-family: var(--font-montserrat), sans-serif; }
        .proof-metric-value.red { color: #ef4444; }
        .proof-metric-value.amber { color: #f59e0b; }
        .proof-metric-value.white { color: #f8fafc; }
        .proof-metric-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
        .proof-screenshot { display: block; width: 100%; height: auto; }
        .proof-alert-row {
          padding: 11px 18px; display: flex; align-items: center; gap: 9px;
          background: rgba(239,68,68,0.06); border-top: 1px solid rgba(239,68,68,0.15);
        }
        .proof-alert-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #ef4444; flex-shrink: 0;
          animation: pulse-dot 1.8s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.7); }
        }
        .proof-alert-text { font-size: 12px; color: #fca5a5; font-weight: 500; }

        /* ── CTA ── */
        .cta-primary {
          display: inline-block; background: #f59e0b; color: #020817;
          font-weight: 800; font-size: clamp(15px, 2vw, 17px);
          padding: 17px 36px; border-radius: 12px; text-decoration: none;
          letter-spacing: -0.01em;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          min-height: 52px; line-height: 1.2;
        }
        .cta-primary:hover {
          background: #fbbf24; transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(245,158,11,0.38);
        }
        .cta-sub-note { font-size: 12px; color: #334155; margin-top: 12px; }

        /* ── Quote Banner ── */
        .quote-section {
          padding: 56px 20px;
          text-align: center;
          background: linear-gradient(180deg, #020817 0%, #080f1e 100%);
          border-top: 1px solid #0f172a;
        }
        .quote-text {
          font-size: clamp(22px, 4vw, 38px);
          font-weight: 900; line-height: 1.25;
          letter-spacing: -0.02em; color: #f8fafc;
          max-width: 680px; margin: 0 auto;
          font-family: var(--font-montserrat), sans-serif;
        }
        .quote-text em { color: #ef4444; font-style: normal; }

        /* ── Pain Section ── */
        .pain-section {
          background: #080f1e; padding: 64px 20px;
          border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;
        }
        .section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.15em; color: #64748b; margin-bottom: 12px;
        }
        .section-headline {
          font-size: clamp(24px, 4vw, 40px); font-weight: 900; line-height: 1.15;
          letter-spacing: -0.02em; margin-bottom: 32px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .pain-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
        .pain-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 0; border-bottom: 1px solid #1e293b;
          font-size: clamp(15px, 2vw, 17px); color: #cbd5e1; font-weight: 500;
        }
        .pain-item:last-child { border-bottom: none; }
        .pain-item-icon { color: #ef4444; font-size: 15px; flex-shrink: 0; }

        /* ── Stats Bar ── */
        .pain-stat-bar {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #1e293b;
          border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; margin-top: 40px;
        }
        .pain-stat { background: #0f172a; padding: 22px 16px; text-align: center; }
        .pain-stat-number { font-size: clamp(26px, 3.5vw, 36px); font-weight: 900; color: #ef4444; font-family: var(--font-montserrat), sans-serif; line-height: 1; }
        .pain-stat-label { font-size: 11px; color: #64748b; margin-top: 5px; line-height: 1.4; }

        /* ── Solution ── */
        .solution-section { padding: 64px 20px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 36px; }
        .step-card {
          background: #0f172a; border: 1px solid #1e293b;
          border-radius: 14px; padding: 24px 20px 28px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .step-card:hover { border-color: rgba(245,158,11,0.35); transform: translateY(-3px); }
        .step-number { font-size: 10px; font-weight: 700; color: #f59e0b; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        .step-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 14px;
        }
        .step-title { font-size: 16px; font-weight: 800; color: #f8fafc; margin-bottom: 6px; font-family: var(--font-montserrat), sans-serif; }
        .step-desc { font-size: 13px; color: #64748b; line-height: 1.55; }

        /* ── Video ── */
        .video-section { padding: 0 20px 64px; }

        /* ── Final Close ── */
        .close-section { padding: 72px 20px 90px; text-align: center; }
        .close-headline {
          font-size: clamp(26px, 5vw, 50px); font-weight: 900; line-height: 1.1;
          letter-spacing: -0.02em; margin-bottom: 14px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .close-sub { font-size: clamp(14px, 1.8vw, 17px); color: #64748b; max-width: 460px; margin: 0 auto 32px; line-height: 1.6; }
        .close-trust { margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
        .trust-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #475569; }
        .trust-check { color: #f59e0b; }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .hero-section { padding: 36px 16px 0; }
          .proof-metrics-row { grid-template-columns: repeat(2, 1fr); }
          .proof-metric:nth-child(2) { border-right: none; }
          .proof-metric:nth-child(3) { grid-column: span 2; border-top: 1px solid #1e293b; border-right: none; }
          .proof-screenshot { display: none; }
          .steps-grid { grid-template-columns: 1fr; }
          .pain-stat-bar { grid-template-columns: 1fr; }
          .pain-stat { border-bottom: 1px solid #1e293b; }
          .pain-stat:last-child { border-bottom: none; }
          .close-trust { gap: 12px; }
        }
        @media (min-width: 481px) and (max-width: 760px) {
          .proof-screenshot { display: none; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .step-card:last-child { grid-column: span 2; }
        }
      `}</style>

      {/* ── HERO + PROOF (above fold) ── */}
      <section className="hero-section">
        <div className="scan-container">
          <div className="hero-eyebrow">Every night your bar is open, money walks out the door</div>
          <h1 className="hero-headline">
            Your Bar Is Losing Money Every Night.{' '}
            <span className="accent-red">You Just Don&apos;t See It Yet.</span>
          </h1>
          <p className="hero-sub">
            Overpouring, waste, and missing inventory quietly drain your profits.
            BarGuard shows you exactly where.
          </p>

          {/* Proof card — visible before scrolling */}
          <div className="proof-card">
            <div className="proof-card-header">
              <div className="proof-dot" style={{ background: '#ef4444' }} />
              <div className="proof-dot" style={{ background: '#f59e0b' }} />
              <div className="proof-dot" style={{ background: '#22c55e' }} />
              <span className="proof-title-text">BarGuard — Loss Detection Report</span>
            </div>
            <div className="proof-metrics-row">
              <div className="proof-metric">
                <div className="proof-metric-label">Estimated Loss This Week</div>
                <div className="proof-metric-value red">$847</div>
                <div className="proof-metric-sub">↑ 23% vs last week</div>
              </div>
              <div className="proof-metric">
                <div className="proof-metric-label">High-Risk Items Flagged</div>
                <div className="proof-metric-value amber">3</div>
                <div className="proof-metric-sub">Requires immediate review</div>
              </div>
              <div className="proof-metric">
                <div className="proof-metric-label">Variance Detected On</div>
                <div className="proof-metric-value white">Top Seller</div>
                <div className="proof-metric-sub">Grey Goose Vodka 1.75L</div>
              </div>
            </div>
            <Image
              src="/images/Dashboard.png"
              alt="BarGuard inventory loss dashboard"
              width={700}
              height={360}
              className="proof-screenshot"
              priority
            />
            <div className="proof-alert-row">
              <div className="proof-alert-dot" />
              <span className="proof-alert-text">
                Patrón Tequila — 2.4 oz variance per serving over last 47 transactions
              </span>
            </div>
          </div>

          {/* CTA directly under proof */}
          <Link
            href="/signup"
            className="cta-primary"
            data-gtm-event="scan_cta_hero"
            data-gtm-label="scan_hero_cta"
          >
            Show Me Where I&apos;m Losing Money →
          </Link>
          <p className="cta-sub-note">No credit card required · Free 14-day trial</p>
        </div>
      </section>

      {/* ── EMOTIONAL ANCHOR ── */}
      <section className="quote-section">
        <div className="scan-container">
          <p className="quote-text">
            &ldquo;Every night you don&apos;t have this,{' '}
            <em>money leaves with your last customer.</em>&rdquo;
          </p>
        </div>
      </section>

      {/* ── PAIN AMPLIFICATION (tightened) ── */}
      <section className="pain-section">
        <div className="scan-container">
          <p className="section-label">The problem you can&apos;t see</p>
          <h2 className="section-headline">
            Most Bar Owners Don&apos;t Know<br />They&apos;re Losing Thousands
          </h2>
          <ul className="pain-list">
            <li className="pain-item">
              <span className="pain-item-icon">▸</span>
              Overpouring adds up fast
            </li>
            <li className="pain-item">
              <span className="pain-item-icon">▸</span>
              Inventory counts are often wrong
            </li>
            <li className="pain-item">
              <span className="pain-item-icon">▸</span>
              Staff mistakes go unnoticed
            </li>
            <li className="pain-item">
              <span className="pain-item-icon">▸</span>
              Small losses turn into thousands
            </li>
          </ul>
          <div className="pain-stat-bar">
            <div className="pain-stat">
              <div className="pain-stat-number">25%</div>
              <div className="pain-stat-label">of bar revenue lost to shrinkage &amp; waste on average</div>
            </div>
            <div className="pain-stat">
              <div className="pain-stat-number">$6,000+</div>
              <div className="pain-stat-label">average monthly loss at a mid-volume bar without tracking</div>
            </div>
            <div className="pain-stat">
              <div className="pain-stat-number">0</div>
              <div className="pain-stat-label">of those losses visible without a real inventory system</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="solution-section">
        <div className="scan-container">
          <p className="section-label">How it works</p>
          <h2 className="section-headline">BarGuard Finds What You&apos;re Missing</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">Step 01</div>
              <div className="step-icon">📸</div>
              <div className="step-title">Scan Invoices in Seconds</div>
              <p className="step-desc">Point your phone at any invoice. AI reads it instantly — no typing, no spreadsheets.</p>
            </div>
            <div className="step-card">
              <div className="step-number">Step 02</div>
              <div className="step-icon">📊</div>
              <div className="step-title">Track Inventory Automatically</div>
              <p className="step-desc">Count your stock, sync your POS — BarGuard calculates what should be there vs. what is.</p>
            </div>
            <div className="step-card">
              <div className="step-number">Step 03</div>
              <div className="step-icon">🚨</div>
              <div className="step-title">Get Alerts When Something&apos;s Off</div>
              <p className="step-desc">High-variance items flagged the moment they appear. Catch losses in days, not months.</p>
            </div>
          </div>

          {/* Mid-page CTA after solution */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link
              href="/signup"
              className="cta-primary"
              data-gtm-event="scan_cta_mid"
              data-gtm-label="scan_mid_cta"
            >
              Find My Profit Leaks →
            </Link>
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEO (moved lower — doesn't interrupt flow) ── */}
      <section className="video-section">
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: 12 }}>See it in action</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 28, fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Watch How Bar Owners Catch Losses in Minutes
          </h2>
          <DemoVideo />
        </div>
      </section>

      {/* ── FINAL CLOSE ── */}
      <section className="close-section">
        <div className="scan-container">
          <h2 className="close-headline">
            Catch Losses<br />Before They Add Up
          </h2>
          <p className="close-sub">
            Start your free trial and see your first variance report within minutes of signing up.
          </p>
          <Link
            href="/signup"
            className="cta-primary"
            style={{ fontSize: 17, padding: '19px 44px' }}
            data-gtm-event="scan_cta_close"
            data-gtm-label="scan_close_cta"
          >
            Start Free Trial
          </Link>
          <div className="close-trust">
            <span className="trust-item"><span className="trust-check">✓</span> No credit card required</span>
            <span className="trust-item"><span className="trust-check">✓</span> 14-day free trial</span>
            <span className="trust-item"><span className="trust-check">✓</span> Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  )
}
