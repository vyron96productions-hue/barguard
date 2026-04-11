import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Bar Inventory Software Pricing — BarGuard',
  description: 'Simple, transparent pricing for bars. Plans starting at $99/month with a 14-day free trial, no credit card required. Stop losing money to shrinkage.',
  alternates: { canonical: 'https://barguard.app/pricing' },
  openGraph: { url: 'https://barguard.app/pricing' },
}

export default async function PricingPage() {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
  return <PricingClient isSignedIn={isSignedIn} />
}
