export default function PrivacyPage() {
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
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: '#475569' }}>Last updated: March 18, 2026</p>
        </div>

        <p style={pStyle}>
          BarGuard (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service at barguard.app.
        </p>

        <h2 style={h2Style}>Information We Collect</h2>
        <p style={pStyle}>
          We collect information you provide directly to us, including when you create an account, set up your business profile, or contact us for support. This includes your name, email address, business name, and billing information.
        </p>
        <p style={pStyle}>
          We also collect information automatically when you use our service, including usage data, log data (IP address, browser type, pages visited), and device information. Inventory data you enter — items, counts, purchase records — is stored securely and used solely to provide the service to you.
        </p>

        <h2 style={h2Style}>How We Use Your Information</h2>
        <p style={pStyle}>We use the information we collect to:</p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li>Provide, operate, and maintain the BarGuard service</li>
          <li>Process transactions and send related information (receipts, invoices)</li>
          <li>Send transactional emails (password resets, account notifications)</li>
          <li>Respond to your comments and questions</li>
          <li>Monitor and analyze usage patterns to improve the service</li>
          <li>Detect and prevent fraudulent or unauthorized use</li>
        </ul>

        <h2 style={h2Style}>Data Storage &amp; Security</h2>
        <p style={pStyle}>
          Your data is stored in Supabase (PostgreSQL) with row-level security enabled. We use industry-standard encryption in transit (TLS) and at rest. Access to production data is restricted to authorized personnel only.
        </p>
        <p style={pStyle}>
          We retain your data for as long as your account is active. If you delete your account, we will delete your data within 30 days, except where we are required to retain it for legal or compliance purposes.
        </p>

        <h2 style={h2Style}>Sharing Your Information</h2>
        <p style={pStyle}>
          We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted third-party service providers who assist us in operating the service, including:
        </p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li><strong style={{ color: '#cbd5e1' }}>Supabase</strong> — database and authentication</li>
          <li><strong style={{ color: '#cbd5e1' }}>Stripe</strong> — payment processing</li>
          <li><strong style={{ color: '#cbd5e1' }}>Resend</strong> — transactional email delivery</li>
          <li><strong style={{ color: '#cbd5e1' }}>Anthropic</strong> — AI-powered invoice scanning (invoice images only, not inventory data)</li>
          <li><strong style={{ color: '#cbd5e1' }}>Vercel</strong> — hosting and deployment</li>
        </ul>
        <p style={pStyle}>
          Each of these providers has their own privacy policy and we encourage you to review them.
        </p>

        <h2 style={h2Style}>Cookies</h2>
        <p style={pStyle}>
          We use cookies and similar tracking technologies to maintain your session and remember your preferences. Session cookies are essential for the service to function. We do not use advertising or tracking cookies.
        </p>

        <h2 style={h2Style}>Your Rights</h2>
        <p style={pStyle}>You have the right to:</p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Export your inventory data in a standard format</li>
          <li>Opt out of non-essential communications</li>
        </ul>
        <p style={pStyle}>To exercise any of these rights, contact us at <a href="mailto:privacy@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>privacy@barguard.app</a>.</p>

        <h2 style={h2Style}>Age Requirement</h2>
        <p style={pStyle}>
          BarGuard is intended for use by individuals who are of legal drinking age (21 or older in the United States). We do not knowingly collect personal information from individuals under the age of 21.
        </p>

        <h2 style={h2Style}>Changes to This Policy</h2>
        <p style={pStyle}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice in the application. Your continued use of the service after changes become effective constitutes your acceptance of the updated policy.
        </p>

        <h2 style={h2Style}>Contact Us</h2>
        <p style={pStyle}>
          If you have questions about this Privacy Policy or our privacy practices, please contact us at <a href="mailto:privacy@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>privacy@barguard.app</a>.
        </p>
      </div>
    </div>
  )
}
