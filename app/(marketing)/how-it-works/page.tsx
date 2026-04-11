import type { Metadata } from 'next'
import ScreenshotsClient from './ScreenshotsClient'

export const metadata: Metadata = {
  title: 'How It Works — See BarGuard in Action',
  description: 'Real screenshots of every BarGuard feature — AI invoice scanning, variance reports, stock levels, sales analytics, profit intelligence, and more.',
  alternates: { canonical: 'https://barguard.app/how-it-works' },
  openGraph: { url: 'https://barguard.app/how-it-works' },
}

export default function ScreenshotsPage() {
  return <ScreenshotsClient />
}
