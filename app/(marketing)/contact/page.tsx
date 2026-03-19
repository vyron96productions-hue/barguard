import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the BarGuard team. We are here to help with questions, support, billing, and partnerships.',
  openGraph: { url: 'https://barguard.app/contact' },
}

export default function ContactPage() {
  return <ContactClient />
}
