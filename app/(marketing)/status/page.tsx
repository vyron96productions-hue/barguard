import type { Metadata } from 'next'
import StatusClient from './StatusClient'

export const metadata: Metadata = {
  title: 'System Status — BarGuard',
  description: 'Live status for all BarGuard services — application, database, payments, AI features, and email. Updated every 60 seconds.',
  alternates: { canonical: 'https://barguard.app/status' },
  openGraph: {
    title: 'System Status — BarGuard',
    description: 'Live status for all BarGuard services — application, database, payments, AI features, and email. Updated every 60 seconds.',
    url: 'https://barguard.app/status',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function StatusPage() {
  return <StatusClient />
}
