import type { Metadata } from 'next'
import '../globals.css'
import Link from 'next/link'
import Image from 'next/image'
import { Montserrat } from 'next/font/google'
import MarketingNav from '@/components/MarketingNav'
import ChatWidget from '@/components/ChatWidget'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['800'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'BarGuard — Stop Losing Money at Your Bar',
  description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost thousands.',
  openGraph: {
    url: 'https://barguard.app',
    images: [{ url: '/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .footer-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 40px; }
        .footer-links { display: flex; gap: 48px; flex-wrap: wrap; }
        .footer-social { color: #475569; transition: color 0.2s; }
        .footer-social:hover { color: #f59e0b; }
        @media (max-width: 640px) {
          .footer-grid { flex-direction: column; }
          .footer-links { gap: 32px; }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'BarGuard',
          url: 'https://barguard.app',
          logo: 'https://barguard.app/barguard_icon.png',
          description: 'AI-powered inventory loss detection for bars and restaurants.',
          email: 'support@barguard.app',
          sameAs: [
            'https://www.facebook.com/profile.php?id=61577657877985',
            'https://x.com/BarguardLLC',
          ],
        }) }}
      />
      <MarketingNav />
      <main className={montserrat.variable} style={{ paddingTop: 64 }}>
        {children}
      </main>
      <footer style={{ borderTop: '1px solid #1e293b', backgroundColor: '#020817', padding: '48px 0 32px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Image src="/barguard_icon.png" alt="" width={48} height={48} style={{ height: 48, width: 'auto', display: 'block' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>BarGuard</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 240, lineHeight: 1.6 }}>AI-powered inventory loss detection for bars and restaurants.</p>
            </div>
            <div className="footer-links">
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Product</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/features" data-gtm-event="footer_click" data-gtm-label="footer_features" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Features</Link>
                  <Link href="/pricing" data-gtm-event="footer_click" data-gtm-label="footer_pricing" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Pricing</Link>
                  <Link href="/how-it-works" data-gtm-event="footer_click" data-gtm-label="footer_screenshots" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>How It Works</Link>
                  <Link href="/faq" data-gtm-event="footer_click" data-gtm-label="footer_faq" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>FAQ</Link>
                  <Link href="/about" data-gtm-event="footer_click" data-gtm-label="footer_why_barguard" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Why BarGuard</Link>
                  <Link href="/contact" data-gtm-event="footer_click" data-gtm-label="footer_contact" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Contact</Link>
                  <Link href="/dashboard" data-gtm-event="footer_click" data-gtm-label="footer_dashboard" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Partners</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/partners" data-gtm-event="footer_click" data-gtm-label="footer_partners" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Partner Program</Link>
                  <Link href="/partner-login" data-gtm-event="footer_click" data-gtm-label="footer_partner_login" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Partner Login</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Legal</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/privacy" data-gtm-event="footer_click" data-gtm-label="footer_privacy" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
                  <Link href="/terms" data-gtm-event="footer_click" data-gtm-label="footer_terms" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</Link>
                  <Link href="/refund" data-gtm-event="footer_click" data-gtm-label="footer_refund" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>Refund Policy</Link>
                  <Link href="/status" data-gtm-event="footer_click" data-gtm-label="footer_status" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>System Status</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748b' }}>© 2026 BarGuard. All rights reserved.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <a href="https://www.facebook.com/profile.php?id=61577657877985" target="_blank" rel="noreferrer" data-gtm-event="footer_click" data-gtm-label="footer_facebook" aria-label="BarGuard on Facebook" className="footer-social">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
              <a href="https://x.com/BarguardLLC" target="_blank" rel="noreferrer" data-gtm-event="footer_click" data-gtm-label="footer_x" aria-label="BarGuard on X" className="footer-social">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </>
  )
}
