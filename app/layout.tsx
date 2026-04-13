import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
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
    images: [{ url: '/Barguard_web_banner.webp', width: 1200, height: 630, alt: 'BarGuard — AI Bar Inventory Loss Detection Software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarGuard — Stop Losing Money at Your Bar',
    description: 'AI-powered inventory loss detection for bars. Catch shrinkage, over-pouring, and stock discrepancies before they cost you thousands.',
    images: ['/Barguard_web_banner.webp'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PS3KRRMR');`,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased overflow-x-hidden" style={{ backgroundColor: '#080e1a' }}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PS3KRRMR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
      </body>
    </html>
  )
}
