import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Bar Inventory Software Pricing — BarGuard',
  description: 'Simple, transparent pricing for bars. Plans starting at $129/month with a 14-day free trial, no credit card required. Stop losing money to shrinkage.',
  alternates: { canonical: 'https://barguard.app/pricing' },
  openGraph: {
    title: 'Bar Inventory Software Pricing — BarGuard',
    description: 'Simple, transparent pricing for bars. Plans starting at $129/month with a 14-day free trial, no credit card required.',
    url: 'https://barguard.app/pricing',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default async function PricingPage() {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
  return <PricingClient isSignedIn={isSignedIn} />
}
