import type { Metadata } from 'next'
import ScreenshotsClient from './ScreenshotsClient'

export const metadata: Metadata = {
  title: 'How It Works — See BarGuard in Action',
  description: 'Real screenshots of every BarGuard feature — AI invoice scanning, variance reports, stock levels, sales analytics, profit intelligence, and more.',
  alternates: { canonical: 'https://barguard.app/how-it-works' },
  openGraph: {
    title: 'How BarGuard Works — See It in Action',
    description: 'Real screenshots of every BarGuard feature — AI invoice scanning, variance reports, stock levels, sales analytics, and profit intelligence.',
    url: 'https://barguard.app/how-it-works',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function ScreenshotsPage() {
  return <ScreenshotsClient />
}
