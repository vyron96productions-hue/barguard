import type { Metadata } from 'next'
import FeaturesClient from './FeaturesClient'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Every feature BarGuard offers — AI invoice scanning, variance tracking, POS integration with Square and Clover, profit intelligence, and more.',
  openGraph: { url: 'https://barguard.app/features' },
}

export default function FeaturesPage() {
  return <FeaturesClient />
}
