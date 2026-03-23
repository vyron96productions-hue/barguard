import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for bars. Plans starting at $99/month with a 14-day free trial. No credit card required.',
  openGraph: { url: 'https://barguard.app/pricing' },
}

export default async function PricingPage() {
  const cookieStore = await cookies()
  const isSignedIn = cookieStore.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
  return <PricingClient isSignedIn={isSignedIn} />
}
