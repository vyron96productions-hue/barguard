import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'BarGuard — Stop Losing Money at Your Bar',
    template: '%s | BarGuard',
  },
  description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost you thousands.',
  metadataBase: new URL('https://barguard.app'),
  openGraph: {
    type: 'website',
    siteName: 'BarGuard',
    title: 'BarGuard — Stop Losing Money at Your Bar',
    description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost you thousands.',
    images: [{ url: '/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
  twitter: {
    card: 'summary',
    title: 'BarGuard — Stop Losing Money at Your Bar',
    description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost you thousands.',
    images: ['/barguard_icon.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
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
        {children}
      </body>
    </html>
  )
}
