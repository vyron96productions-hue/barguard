import type { Metadata } from 'next'
import '../globals.css'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import MarketingNav from '@/components/MarketingNav'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['800'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'BarGuard — Stop Losing Money at Your Bar',
  description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost thousands.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .footer-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 40px; }
        .footer-links { display: flex; gap: 48px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .footer-grid { flex-direction: column; }
          .footer-links { gap: 32px; }
        }
      `}</style>
      <MarketingNav />
      <div className={montserrat.variable} style={{ paddingTop: 64 }}>
        {children}
      </div>
      <footer style={{ borderTop: '1px solid #1e293b', backgroundColor: '#020817', padding: '48px 0 32px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/barguard_icon.png" alt="BarGuard" style={{ height: 48, width: 'auto', display: 'block' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>BarGuard</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', maxWidth: 240, lineHeight: 1.6 }}>AI-powered inventory loss detection for bars and restaurants.</p>
            </div>
            <div className="footer-links">
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Product</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/pricing" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>Pricing</Link>
                  <Link href="/dashboard" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Legal</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/privacy" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
                  <Link href="/terms" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
                  <Link href="/refund" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>Refund Policy</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#334155' }}>© 2026 BarGuard. All rights reserved.</p>
            <p style={{ fontSize: 13, color: '#334155' }}>Made for bars that care about their bottom line.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
