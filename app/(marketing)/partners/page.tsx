import type { Metadata } from 'next'
import PartnersClient from './PartnersClient'

export const metadata: Metadata = {
  title: 'Partner Program — Resell BarGuard to Bars & Restaurants',
  description: 'Partner with BarGuard to offer bars and restaurants AI-powered inventory loss detection. Built for POS resellers, MSPs, and merchant service providers.',
  alternates: { canonical: 'https://barguard.app/partners' },
  openGraph: { url: 'https://barguard.app/partners' },
}

export default function PartnersPage() {
  return <PartnersClient />
}
