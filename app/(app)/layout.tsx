import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { TrialBanner } from '@/components/TrialBanner'
import { BusinessProvider } from '@/app/(app)/BusinessContext'
import Image from 'next/image'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <MobileNav />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
          <TrialBanner>
            <div className="px-4 py-5 md:px-8 md:py-8 lg:px-10 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-8">
              {children}
            </div>
          </TrialBanner>
          <div style={{ borderTop: '1px solid #1e293b', padding: '12px 24px', display: 'flex', justifyContent: 'center' }}>
            <a href="https://verdictiq.org" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.04em' }}>Engineered By</span>
              <Image src="/verdictiq-logo.png" alt="VerdictIQ" width={100} height={34} style={{ height: 22, width: 'auto', display: 'block', filter: 'invert(1) hue-rotate(180deg) saturate(1.5)', opacity: 0.5 }} />
            </a>
          </div>
        </main>
      </div>
    </BusinessProvider>
  )
}
