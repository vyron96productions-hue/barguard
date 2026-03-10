import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export const metadata: Metadata = {
  title: 'BarGuard — Liquor Loss Detector',
  description: 'Detect liquor shrinkage before it costs thousands',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased overflow-x-hidden" style={{ backgroundColor: '#080e1a' }}>
        <MobileNav />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0 px-4 py-5 md:px-8 md:py-8 lg:px-10 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
