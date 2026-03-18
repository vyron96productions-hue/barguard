import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarGuard',
  description: 'AI-powered bar inventory loss detection',
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
