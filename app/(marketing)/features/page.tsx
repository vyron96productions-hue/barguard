import type { Metadata } from 'next'
import FeaturesClient from './FeaturesClient'

export const metadata: Metadata = {
  title: 'Bar Inventory Software Features — BarGuard',
  description: 'Every BarGuard feature — AI invoice scanning, variance tracking, POS sync with Square and Clover, smart reorder alerts, and profit intelligence for bars.',
  alternates: { canonical: 'https://barguard.app/features' },
  openGraph: {
    title: 'Bar Inventory Software Features — BarGuard',
    description: 'Every BarGuard feature — AI invoice scanning, variance tracking, POS sync, smart reorder alerts, and profit intelligence for bars.',
    url: 'https://barguard.app/features',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function FeaturesPage() {
  return <FeaturesClient />
}
