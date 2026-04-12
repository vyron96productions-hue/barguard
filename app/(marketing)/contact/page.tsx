import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact BarGuard — Get Help or Ask a Question',
  description: 'Reach the BarGuard team for questions, support, billing, or partnership inquiries. We typically respond within one business day.',
  alternates: { canonical: 'https://barguard.app/contact' },
  openGraph: {
    title: 'Contact BarGuard — Get Help or Ask a Question',
    description: 'Reach the BarGuard team for support, billing, or partnership inquiries. We typically respond within one business day.',
    url: 'https://barguard.app/contact',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function ContactPage() {
  return <ContactClient />
}
