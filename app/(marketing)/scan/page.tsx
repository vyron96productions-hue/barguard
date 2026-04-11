import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

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
        /* ---- Utility ---- */
        .scan-container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
        .scan-container-wide { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

        /* ---- Hero ---- */
        .hero-section {
          padding: 80px 24px 64px;
          text-align: center;
        }
        .hero-eyebrow {
          display: inline-block;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 28px;
        }
        .hero-headline {
          font-size: clamp(32px, 6vw, 64px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .hero-headline .accent-red { color: #ef4444; }
        .hero-sub {
          font-size: clamp(16px, 2.5vw, 20px);
          color: #94a3b8;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 40px;
          font-weight: 400;
        }

        /* ---- Primary CTA ---- */
        .cta-primary {
          display: inline-block;
          background: #f59e0b;
          color: #020817;
          font-weight: 800;
          font-size: clamp(15px, 2vw, 18px);
          padding: 18px 40px;
          border-radius: 12px;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(245,158,11,0);
        }
        .cta-primary:hover {
          background: #fbbf24;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(245,158,11,0.35);
        }
        .cta-sub-note {
          font-size: 13px;
          color: #475569;
          margin-top: 14px;
        }

        /* ---- Proof Card ---- */
        .proof-section {
          padding: 0 24px 80px;
        }
        .proof-card {
          max-width: 760px;
          margin: 0 auto;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.08);
        }
        .proof-card-header {
          padding: 18px 24px;
          border-bottom: 1px solid #1e293b;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .proof-dot { width: 10px; height: 10px; border-radius: 50%; }
        .proof-title-text { font-size: 13px; font-weight: 600; color: #64748b; }
        .proof-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-bottom: 1px solid #1e293b;
        }
        .proof-metric {
          padding: 20px 24px;
          border-right: 1px solid #1e293b;
        }
        .proof-metric:last-child { border-right: none; }
        .proof-metric-label { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .proof-metric-value { font-size: clamp(22px, 3.5vw, 30px); font-weight: 800; line-height: 1; font-family: var(--font-montserrat), sans-serif; }
        .proof-metric-value.red { color: #ef4444; }
        .proof-metric-value.amber { color: #f59e0b; }
        .proof-metric-value.white { color: #f8fafc; }
        .proof-metric-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .proof-screenshot {
          display: block;
          width: 100%;
          height: auto;
        }
        .proof-alert-row {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239,68,68,0.06);
          border-top: 1px solid rgba(239,68,68,0.15);
        }
        .proof-alert-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ef4444;
          flex-shrink: 0;
          animation: pulse-dot 1.8s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
        .proof-alert-text { font-size: 13px; color: #fca5a5; font-weight: 500; }

        /* ---- Pain Section ---- */
        .pain-section {
          background: #080f1e;
          padding: 72px 24px;
          border-top: 1px solid #1e293b;
          border-bottom: 1px solid #1e293b;
        }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #64748b;
          margin-bottom: 14px;
        }
        .section-headline {
          font-size: clamp(26px, 4.5vw, 44px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .section-sub {
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          max-width: 520px;
          margin-bottom: 40px;
        }
        .pain-bullets { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
        .pain-bullet {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          transition: border-color 0.2s;
        }
        .pain-bullet:hover { border-color: rgba(239,68,68,0.3); }
        .pain-bullet-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #f87171;
          font-size: 16px;
        }
        .pain-bullet-text { font-size: 15px; color: #cbd5e1; line-height: 1.5; }
        .pain-bullet-text strong { color: #f8fafc; font-weight: 700; display: block; margin-bottom: 2px; font-size: 15px; }

        /* ---- Pain Stats Bar ---- */
        .pain-stat-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #1e293b;
          border: 1px solid #1e293b;
          border-radius: 16px;
          overflow: hidden;
          margin-top: 48px;
        }
        .pain-stat {
          background: #0f172a;
          padding: 24px 20px;
          text-align: center;
        }
        .pain-stat-number { font-size: clamp(28px, 4vw, 40px); font-weight: 900; color: #ef4444; font-family: var(--font-montserrat), sans-serif; line-height: 1; }
        .pain-stat-label { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.4; }

        /* ---- Solution Section ---- */
        .solution-section {
          padding: 80px 24px;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        .step-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 28px 24px 32px;
          position: relative;
          transition: border-color 0.2s, transform 0.2s;
        }
        .step-card:hover {
          border-color: rgba(245,158,11,0.35);
          transform: translateY(-4px);
        }
        .step-number {
          font-size: 11px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .step-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          margin-bottom: 18px;
        }
        .step-title { font-size: 18px; font-weight: 800; color: #f8fafc; margin-bottom: 8px; font-family: var(--font-montserrat), sans-serif; }
        .step-desc { font-size: 14px; color: #64748b; line-height: 1.6; }

        /* ---- Mid CTA ---- */
        .mid-cta-section {
          background: #080f1e;
          border-top: 1px solid #1e293b;
          border-bottom: 1px solid #1e293b;
          padding: 60px 24px;
          text-align: center;
        }
        .mid-cta-headline {
          font-size: clamp(22px, 3.5vw, 36px);
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 10px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .mid-cta-sub { font-size: 16px; color: #64748b; margin-bottom: 28px; }

        /* ---- Final Close ---- */
        .close-section {
          padding: 80px 24px 100px;
          text-align: center;
        }
        .close-headline {
          font-size: clamp(28px, 5vw, 54px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          font-family: var(--font-montserrat), sans-serif;
        }
        .close-sub {
          font-size: clamp(15px, 2vw, 18px);
          color: #64748b;
          max-width: 500px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }
        .close-trust {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #475569;
        }
        .trust-check { color: #f59e0b; font-size: 14px; }

        /* ---- Responsive ---- */
        @media (max-width: 640px) {
          .proof-metrics-row { grid-template-columns: 1fr; }
          .proof-metric { border-right: none; border-bottom: 1px solid #1e293b; }
          .proof-metric:last-child { border-bottom: none; }
          .steps-grid { grid-template-columns: 1fr; }
          .pain-stat-bar { grid-template-columns: 1fr; }
          .pain-stat { border-bottom: 1px solid #1e293b; }
          .pain-stat:last-child { border-bottom: none; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .step-card:last-child { grid-column: span 2; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="scan-container">
          <div className="hero-eyebrow">Every night your bar is open, money walks out the door</div>
          <h1 className="hero-headline">
            Your Bar Is Losing Money<br />
            Every Night.{' '}
            <span className="accent-red">You Just Don't See It Yet.</span>
          </h1>
          <p className="hero-sub">
            Overpouring, waste, and missing inventory are quietly draining your profits.
            BarGuard shows you exactly where it&apos;s happening.
          </p>
          <Link
            href="/signup"
            className="cta-primary"
            data-gtm-event="scan_cta_hero"
            data-gtm-label="scan_hero_see_losses"
          >
            See Where You&apos;re Losing Money →
          </Link>
          <p className="cta-sub-note">No credit card required. Free 14-day trial.</p>
        </div>
      </section>

      {/* ── VISUAL PROOF ── */}
      <section className="proof-section">
        <div className="scan-container">
          <div className="proof-card">
            <div className="proof-card-header">
              <div className="proof-dot" style={{ background: '#ef4444' }} />
              <div className="proof-dot" style={{ background: '#f59e0b' }} />
              <div className="proof-dot" style={{ background: '#22c55e' }} />
              <span className="proof-title-text" style={{ marginLeft: 6 }}>
                BarGuard — Loss Detection Report
              </span>
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
              width={760}
              height={400}
              className="proof-screenshot"
              style={{ display: 'block', width: '100%', height: 'auto' }}
              priority
            />

            <div className="proof-alert-row">
              <div className="proof-alert-dot" />
              <span className="proof-alert-text">
                Patron Tequila — 2.4 oz variance per serving detected over last 47 transactions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN AMPLIFICATION ── */}
      <section className="pain-section">
        <div className="scan-container">
          <p className="section-label">The problem you can&apos;t see</p>
          <h2 className="section-headline">
            Most Bar Owners Don&apos;t Know<br />
            They&apos;re Losing Thousands
          </h2>
          <p className="section-sub">
            The losses aren&apos;t dramatic. They&apos;re slow. A splash here, a miscounted case
            there — until it adds up to $2,000, $5,000, $10,000 a month gone.
          </p>

          <ul className="pain-bullets">
            <li className="pain-bullet">
              <div className="pain-bullet-icon">⚡</div>
              <div className="pain-bullet-text">
                <strong>Overpouring adds up fast</strong>
                An extra half-ounce per drink across 200 drinks a night costs you
                thousands every month — and your staff doesn&apos;t even know they&apos;re doing it.
              </div>
            </li>
            <li className="pain-bullet">
              <div className="pain-bullet-icon">📋</div>
              <div className="pain-bullet-text">
                <strong>Inventory counts are often inaccurate</strong>
                Manual counts done under pressure at close are riddled with errors.
                You&apos;re making purchasing decisions based on numbers you can&apos;t trust.
              </div>
            </li>
            <li className="pain-bullet">
              <div className="pain-bullet-icon">👀</div>
              <div className="pain-bullet-text">
                <strong>Staff mistakes go unnoticed</strong>
                Not every loss is theft. Spillage, wrong recipes, and free pours to regulars
                quietly eat your margins. None of it shows up until it&apos;s too late.
              </div>
            </li>
            <li className="pain-bullet">
              <div className="pain-bullet-icon">📉</div>
              <div className="pain-bullet-text">
                <strong>Small losses become big problems</strong>
                A 3% variance sounds small. On $80,000/month in liquor sales,
                that&apos;s $2,400 disappearing every single month.
              </div>
            </li>
          </ul>

          <div className="pain-stat-bar">
            <div className="pain-stat">
              <div className="pain-stat-number">25%</div>
              <div className="pain-stat-label">of bar revenue lost to shrinkage, overpouring &amp; waste on average</div>
            </div>
            <div className="pain-stat">
              <div className="pain-stat-number">$6,000+</div>
              <div className="pain-stat-label">average monthly loss at a mid-volume bar that doesn&apos;t track variance</div>
            </div>
            <div className="pain-stat">
              <div className="pain-stat-number">0</div>
              <div className="pain-stat-label">of those losses are visible without a real inventory system</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="solution-section">
        <div className="scan-container">
          <p className="section-label">How it works</p>
          <h2 className="section-headline">BarGuard Finds What You&apos;re Missing</h2>
          <p className="section-sub">
            No complicated setup. No expensive consultants. Just connect, count, and let
            BarGuard show you where your money is going.
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">Step 01</div>
              <div className="step-icon">📸</div>
              <div className="step-title">Scan Invoices in Seconds</div>
              <p className="step-desc">
                Point your phone at any invoice. AI reads it instantly — no typing, no spreadsheets,
                no manual data entry ever again.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">Step 02</div>
              <div className="step-icon">📊</div>
              <div className="step-title">Track Inventory Automatically</div>
              <p className="step-desc">
                Count your stock, sync your POS, and watch BarGuard calculate exactly
                what should be there vs. what actually is.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">Step 03</div>
              <div className="step-icon">🚨</div>
              <div className="step-title">Get Alerts When Something&apos;s Off</div>
              <p className="step-desc">
                BarGuard flags high-variance items the moment they appear — so you
                catch losses in days, not months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MID CTA ── */}
      <section className="mid-cta-section">
        <div className="scan-container">
          <p className="section-label" style={{ textAlign: 'center' }}>Stop waiting</p>
          <h2 className="mid-cta-headline">
            Every night you don&apos;t have this,<br />
            money leaves with your last customer.
          </h2>
          <p className="mid-cta-sub">You won&apos;t know how much until you look.</p>
          <Link
            href="/signup"
            className="cta-primary"
            data-gtm-event="scan_cta_mid"
            data-gtm-label="scan_mid_check_losses"
          >
            Check Your Bar for Losses Now →
          </Link>
        </div>
      </section>

      {/* ── FINAL CLOSE ── */}
      <section className="close-section">
        <div className="scan-container">
          <h2 className="close-headline">
            Stop Guessing<br />Where the Money Went
          </h2>
          <p className="close-sub">
            Start using BarGuard and take control of your inventory and profits.
            See your first variance report within minutes of signing up.
          </p>
          <Link
            href="/signup"
            className="cta-primary"
            style={{ fontSize: 18, padding: '20px 48px' }}
            data-gtm-event="scan_cta_close"
            data-gtm-label="scan_close_start_trial"
          >
            Start Free Trial
          </Link>
          <div className="close-trust">
            <span className="trust-item">
              <span className="trust-check">✓</span> No credit card required
            </span>
            <span className="trust-item">
              <span className="trust-check">✓</span> 14-day free trial
            </span>
            <span className="trust-item">
              <span className="trust-check">✓</span> Cancel anytime
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
