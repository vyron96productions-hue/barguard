import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for bars. Plans starting at $99/month with a 14-day free trial. No credit card required.',
  openGraph: { url: 'https://barguard.app/pricing' },
}

export default function PricingPage() {
  return <PricingClient />
}
