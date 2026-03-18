export default function TermsPage() {
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
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#f8fafc', letterSpacing: '-0.5px', fontWeight: 800, marginBottom: 16 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: '#475569' }}>Last updated: March 18, 2026</p>
        </div>

        <p style={pStyle}>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of BarGuard (&ldquo;the Service&rdquo;) operated by BarGuard (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By creating an account or using the Service, you agree to be bound by these Terms.
        </p>

        <h2 style={h2Style}>Account Terms</h2>
        <p style={pStyle}>
          You must be at least 18 years old and have the legal authority to enter into these Terms on behalf of yourself or your business. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.
        </p>
        <p style={pStyle}>
          You must provide accurate, current, and complete information when creating your account. One account is provided per business unless you are on the Enterprise plan, which allows up to 5 locations.
        </p>

        <h2 style={h2Style}>Acceptable Use</h2>
        <p style={pStyle}>You agree not to use the Service to:</p>
        <ul style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.75, paddingLeft: 24, marginBottom: 16 }}>
          <li>Violate any applicable laws or regulations</li>
          <li>Upload or transmit malicious code or content</li>
          <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Resell or sublicense access to the Service without our written consent</li>
          <li>Use the Service for any purpose other than bar/restaurant inventory management</li>
        </ul>

        <h2 style={h2Style}>Payment Terms</h2>
        <p style={pStyle}>
          Paid plans are billed monthly or annually in advance. All prices are in USD. By providing a payment method, you authorize us to charge that method for all fees associated with your plan.
        </p>
        <p style={pStyle}>
          If your payment fails, we will notify you and your account may be downgraded or suspended until payment is resolved. Prices may change with 30 days&apos; written notice. Annual plan discounts apply only when paid in full upfront.
        </p>
        <p style={pStyle}>
          New accounts receive a 14-day free trial. No credit card is required to start the trial. At the end of the trial, you must subscribe to a paid plan or your account will be locked (data is retained for 90 days).
        </p>

        <h2 style={h2Style}>Intellectual Property</h2>
        <p style={pStyle}>
          The Service and its original content, features, and functionality are owned by BarGuard and are protected by copyright, trademark, and other intellectual property laws. You retain ownership of all data you enter into the Service.
        </p>
        <p style={pStyle}>
          You grant us a limited license to store, process, and display your data solely for the purpose of providing the Service to you.
        </p>

        <h2 style={h2Style}>Termination</h2>
        <p style={pStyle}>
          You may cancel your subscription at any time through the billing settings in your account. Cancellation takes effect at the end of your current billing period. We may terminate or suspend your account immediately, without prior notice, if you violate these Terms.
        </p>
        <p style={pStyle}>
          Upon termination, your right to use the Service ceases immediately. We will retain your data for 90 days after termination, after which it will be permanently deleted. You may request a data export before termination.
        </p>

        <h2 style={h2Style}>Disclaimer of Warranties</h2>
        <p style={pStyle}>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely secure. Inventory loss calculations and AI-generated insights are provided as a tool to assist decision-making and are not a guarantee of accuracy.
        </p>

        <h2 style={h2Style}>Limitation of Liability</h2>
        <p style={pStyle}>
          To the maximum extent permitted by law, BarGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Service. Our total liability to you for any claims arising under these Terms shall not exceed the amount you paid us in the 12 months preceding the claim.
        </p>

        <h2 style={h2Style}>Governing Law</h2>
        <p style={pStyle}>
          These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.
        </p>

        <h2 style={h2Style}>Changes to Terms</h2>
        <p style={pStyle}>
          We reserve the right to modify these Terms at any time. We will notify you of material changes by email or prominent notice within the Service at least 14 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the new Terms.
        </p>

        <h2 style={h2Style}>Contact</h2>
        <p style={pStyle}>
          For questions about these Terms, please contact us at <a href="mailto:support@barguard.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a>.
        </p>
      </div>
    </div>
  )
}
