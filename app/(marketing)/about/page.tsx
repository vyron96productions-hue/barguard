import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'Why BarGuard Exists',
  description: 'Built by someone who has spent their entire adult life in the hospitality industry — from bartending to owning a nightclub. This is why BarGuard exists.',
  openGraph: { url: 'https://barguard.app/about' },
}

export default function AboutPage() {
  return <AboutClient />
}
