import type { Metadata } from 'next'
import FAQClient from './FAQClient'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about BarGuard — pricing, setup, POS integrations, data privacy, and how the variance detection works.',
  openGraph: { url: 'https://barguard.app/faq' },
}

export default function FAQPage() {
  return <FAQClient />
}
