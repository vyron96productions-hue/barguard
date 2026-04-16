import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'End User License Agreement â€” BarGuard',
  description: 'Read the BarGuard End User License Agreement covering use of the BarGuard application, website, and related services. Effective April 15, 2026.',
  alternates: { canonical: 'https://barguard.app/eula' },
  openGraph: {
    title: 'End User License Agreement â€” BarGuard',
    description: 'Read the BarGuard End User License Agreement covering use of the BarGuard application, website, and related services.',
    url: 'https://barguard.app/eula',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function EulaPage() {
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
  const listStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 1.75,
    paddingLeft: 24,
    marginBottom: 16,
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh', padding: 'clamp(32px, 5vw, 60px) clamp(16px, 5vw, 24px) 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>End User License Agreement</h1>
          <p style={{ fontSize: 14, color: '#475569' }}>Effective date: April 15, 2026</p>
        </div>

        <p style={pStyle}>
          This End User License Agreement (&ldquo;Agreement&rdquo;) is a legal agreement between you
          (&ldquo;User&rdquo;, &ldquo;you&rdquo;) and <strong style={{ color: '#e2e8f0' }}>BarGuard LLC</strong> (&ldquo;Company&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) governing your use of the BarGuard application,
          website, and related services (collectively, the &ldquo;Service&rdquo;).
        </p>
        <p style={pStyle}>
          By accessing or using BarGuard, you agree to be bound by this Agreement.
        </p>

        <h2 style={h2Style}>1. License Grant</h2>
        <p style={pStyle}>
          BarGuard grants you a limited, non-exclusive, non-transferable, revocable license to
          access and use the Service for your internal business operations, subject to this
          Agreement.
        </p>

        <h2 style={h2Style}>2. Restrictions</h2>
        <p style={pStyle}>You agree not to:</p>
        <ul style={listStyle}>
          <li>Copy, modify, or create derivative works of the Service</li>
          <li>Reverse engineer, decompile, or attempt to extract source code</li>
          <li>Resell, sublicense, or distribute the Service without permission</li>
          <li>Use the Service for unlawful purposes</li>
        </ul>

        <h2 style={h2Style}>3. Account Responsibility</h2>
        <p style={pStyle}>You are responsible for:</p>
        <ul style={listStyle}>
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activity under your account</li>
          <li>Ensuring the accuracy of data entered into the system</li>
        </ul>

        <h2 style={h2Style}>4. Data &amp; Usage</h2>
        <p style={pStyle}>
          BarGuard processes operational data including inventory, sales, and usage metrics to
          provide insights and analytics.
        </p>
        <p style={pStyle}>
          We do not guarantee accuracy of results due to dependency on user inputs and third-party
          integrations.
        </p>

        <h2 style={h2Style}>5. Third-Party Integrations</h2>
        <p style={pStyle}>
          The Service may integrate with third-party providers (for example POS systems such as
          Clover, Square, and Toast).
        </p>
        <p style={pStyle}>We are not responsible for:</p>
        <ul style={listStyle}>
          <li>Third-party data accuracy</li>
          <li>Service interruptions from external providers</li>
          <li>Changes made by those providers</li>
        </ul>

        <h2 style={h2Style}>6. Subscription &amp; Billing</h2>
        <p style={pStyle}>BarGuard operates on a subscription basis.</p>
        <ul style={listStyle}>
          <li>Fees are billed in advance</li>
          <li>Subscriptions renew automatically unless canceled</li>
          <li>No refunds except where required by law</li>
        </ul>

        <h2 style={h2Style}>7. Termination</h2>
        <p style={pStyle}>We may suspend or terminate access if:</p>
        <ul style={listStyle}>
          <li>You violate this Agreement</li>
          <li>Your account is inactive or unpaid</li>
        </ul>
        <p style={pStyle}>You may cancel your subscription at any time through your account settings.</p>

        <h2 style={h2Style}>8. Disclaimer of Warranties</h2>
        <p style={pStyle}>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</p>
        <p style={pStyle}>We make no warranties regarding:</p>
        <ul style={listStyle}>
          <li>Accuracy of analytics</li>
          <li>Financial outcomes</li>
          <li>Continuous availability</li>
        </ul>

        <h2 style={h2Style}>9. Limitation of Liability</h2>
        <p style={pStyle}>
          To the maximum extent permitted by law, BarGuard LLC shall not be liable for any
          indirect, incidental, or consequential damages, including loss of profits, data, or
          business opportunities.
        </p>

        <h2 style={h2Style}>10. Indemnification</h2>
        <p style={pStyle}>You agree to indemnify and hold harmless BarGuard LLC from any claims arising from:</p>
        <ul style={listStyle}>
          <li>Your use of the Service</li>
          <li>Your violation of this Agreement</li>
        </ul>

        <h2 style={h2Style}>11. Governing Law</h2>
        <p style={pStyle}>
          This Agreement shall be governed by the laws of the State of South Carolina, United
          States.
        </p>

        <h2 style={h2Style}>12. Changes to This Agreement</h2>
        <p style={pStyle}>
          We may update this Agreement at any time. Continued use of the Service constitutes
          acceptance of the updated terms.
        </p>

        <h2 style={h2Style}>13. Contact</h2>
        <p style={pStyle}>
          For questions regarding this Agreement, contact <strong style={{ color: '#e2e8f0' }}>BarGuard LLC</strong> at{' '}
          <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a>
          {' '}or visit{' '}
          <a href="https://barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>https://barguard.app</a>.
        </p>
      </div>
    </div>
  )
}
