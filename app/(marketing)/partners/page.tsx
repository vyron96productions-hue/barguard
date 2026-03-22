import type { Metadata } from 'next'
import PartnersClient from './PartnersClient'

export const metadata: Metadata = {
  title: 'Partner Program — BarGuard',
  description: 'Partner with BarGuard to offer your bar and restaurant clients AI-powered inventory loss detection. Built for MSPs, POS resellers, and merchant service providers.',
}

export default function PartnersPage() {
  return <PartnersClient />
}
