import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact BarGuard — Get Help or Ask a Question',
  description: 'Reach the BarGuard team for questions, support, billing, or partnership inquiries. We typically respond within one business day.',
  alternates: { canonical: 'https://barguard.app/contact' },
  openGraph: { url: 'https://barguard.app/contact' },
}

export default function ContactPage() {
  return <ContactClient />
}
