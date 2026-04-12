import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy — BarGuard',
  description: 'BarGuard\'s refund and cancellation policy. Learn when refunds apply, how to cancel your subscription, and how to request a refund.',
  alternates: { canonical: 'https://barguard.app/refund' },
  openGraph: {
    title: 'Refund Policy — BarGuard',
    description: 'BarGuard\'s refund and cancellation policy — when refunds apply, how to cancel, and how to request a refund.',
    url: 'https://barguard.app/refund',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function RefundPage() {
  const h2Style: React.CSSProperties = {
    fontFamily: 'var(--font-montserrat)',
    fontSize: 22,
    fontWeight: 800,
    color: '#f59e0b',
    letterSpacing: '-0.5px',
    marginBottom: 12,
    marginTop: 40,
  }
  const pStyle: React.CSSProperties = {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 1.75,
    marginBottom: 16,
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', padding: 'clamp(32px, 5vw, 60px) clamp(16px, 5vw, 24px) 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>Refund Policy</h1>
          <p style={{ fontSize: 14, color: '#475569' }}>Last updated: March 18, 2026</p>
        </div>

        <p style={pStyle}>
          We want you to be completely satisfied with BarGuard. This Refund Policy outlines when and how refunds are issued.
        </p>

        <h2 style={h2Style}>14-Day Free Trial</h2>
        <p style={pStyle}>
          All new BarGuard accounts receive a 14-day free trial with no credit card required. You can explore the full feature set of your chosen plan before committing. We encourage you to thoroughly test the service during your trial period.
        </p>

        <h2 style={h2Style}>Monthly Plans</h2>
        <p style={pStyle}>
          Monthly subscriptions are billed at the start of each billing cycle. We offer a 5-day refund window after each billing date. If you contact us within 5 days of being charged and have not used the service extensively during that period, we will issue a full refund for that month&apos;s charge.
        </p>
        <p style={pStyle}>
          After the 5-day window, no refunds are issued for monthly plan charges. You may cancel at any time and your access will continue until the end of the current billing period.
        </p>

        <h2 style={h2Style}>Annual Plans</h2>
        <p style={pStyle}>
          Annual subscriptions are eligible for pro-rated refunds. If you cancel an annual plan, we will refund the unused portion of your subscription based on the number of full months remaining. For example, if you cancel 4 months into a 12-month plan, you are eligible for a refund of 8 months of the discounted annual rate.
        </p>
        <p style={pStyle}>
          To request an annual plan refund, contact us at <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a> within 60 days of your last annual payment.
        </p>

        <h2 style={h2Style}>Non-Refundable Situations</h2>
        <p style={pStyle}>Refunds will not be issued in the following situations:</p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li>Accounts terminated due to violations of our Terms of Service</li>
          <li>Monthly charges older than 5 days</li>
          <li>Partial month usage after plan downgrade or cancellation</li>
          <li>Charges incurred before cancellation was submitted</li>
        </ul>

        <h2 style={h2Style}>How to Request a Refund</h2>
        <p style={pStyle}>
          To request a refund, email us at <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a> with:
        </p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li>Your account email address</li>
          <li>The reason for your refund request</li>
          <li>The approximate date of the charge</li>
        </ul>
        <p style={pStyle}>
          We process refund requests within 3–5 business days. Approved refunds are returned to the original payment method and may take 5–10 business days to appear on your statement, depending on your bank or card issuer.
        </p>

        <h2 style={h2Style}>Plan Downgrades</h2>
        <p style={pStyle}>
          If you downgrade from a higher plan to a lower plan mid-cycle, the change takes effect at the start of your next billing period. We do not issue partial refunds for plan downgrades on monthly subscriptions. For annual subscriptions, a credit may be applied toward the new plan.
        </p>

        <h2 style={h2Style}>Questions</h2>
        <p style={pStyle}>
          If you have any questions about this Refund Policy or would like to discuss your specific situation, please reach out at <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a>. We&apos;re happy to help.
        </p>
      </div>
    </div>
  )
}
