import type { Metadata } from 'next'
import PartnersClient from './PartnersClient'

export const metadata: Metadata = {
  title: 'Partner Program — Resell BarGuard to Bars & Restaurants',
  description: 'Partner with BarGuard to offer bars and restaurants AI-powered inventory loss detection. Built for POS resellers, MSPs, and merchant service providers.',
  alternates: { canonical: 'https://barguard.app/partners' },
  openGraph: {
    title: 'Partner Program — Resell BarGuard to Bars & Restaurants',
    description: 'Partner with BarGuard to offer AI-powered inventory loss detection to bars and restaurants. Built for POS resellers, MSPs, and merchant service providers.',
    url: 'https://barguard.app/partners',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function PartnersPage() {
  return <PartnersClient />
}
