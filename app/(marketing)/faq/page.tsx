import type { Metadata } from 'next'
import FAQClient from './FAQClient'

export const metadata: Metadata = {
  title: 'Bar Inventory Software FAQ — BarGuard',
  description: 'Common questions about BarGuard — pricing plans, setup time, POS integrations with Square and Clover, data privacy, and how variance detection works.',
  alternates: { canonical: 'https://barguard.app/faq' },
  openGraph: {
    title: 'Bar Inventory Software FAQ — BarGuard',
    description: 'Common questions about BarGuard — pricing, setup time, POS integrations, data privacy, and how variance detection works.',
    url: 'https://barguard.app/faq',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What exactly does BarGuard do?', acceptedAnswer: { '@type': 'Answer', text: "BarGuard tracks your bar's inventory and tells you exactly where product is going missing. You enter your stock counts before and after shifts, import your purchases, and BarGuard calculates the variance — what should have been used versus what actually disappeared. It flags which items are losing you money so you can act on it." } },
    { '@type': 'Question', name: 'How long does setup take?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on how many items you carry. A small bar with 30–40 products might take an hour to get everything entered. A full liquor program with 150+ items will take longer. The good news: you only do it once. After that, your daily workflow is just stock counts and scanning invoices.' } },
    { '@type': 'Question', name: 'Do I need any special hardware or equipment?', acceptedAnswer: { '@type': 'Answer', text: 'No. BarGuard runs entirely in your web browser on any device — phone, tablet, or computer. No scanners, no printers, no special equipment required. Your phone camera is all you need for invoice scanning.' } },
    { '@type': 'Question', name: 'Does my staff need training?', acceptedAnswer: { '@type': 'Answer', text: 'Minimal. Stock counts are straightforward — staff just enter quantities for each item. The AI invoice scanning is one button. The more complex reports and analysis are manager-level tools that one or two people need to learn.' } },
    { '@type': 'Question', name: 'How does the free trial work?', acceptedAnswer: { '@type': 'Answer', text: 'Every new account gets 14 days of full access — no credit card required. You get everything including Pro features like POS integration and vendor management. At the end of 14 days, you choose a plan or your account is locked (your data is kept for 90 days).' } },
    { '@type': 'Question', name: 'Can I switch plans after signing up?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, anytime. You can upgrade or downgrade from your profile page. Upgrades take effect immediately. Downgrades take effect at the start of your next billing period.' } },
    { '@type': 'Question', name: 'Can I cancel anytime?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. No contracts, no cancellation fees. Cancel from your account settings and you keep access until the end of your current billing period. Your data is retained for 90 days after cancellation in case you change your mind.' } },
    { '@type': 'Question', name: 'What is the annual discount?', acceptedAnswer: { '@type': 'Answer', text: 'Paying annually saves 20% compared to monthly billing. Basic goes from $99/mo to $79/mo, Pro from $199/mo to $159/mo, and Enterprise from $399/mo to $319/mo. Annual plans are billed in full upfront and are eligible for pro-rated refunds if you cancel.' } },
    { '@type': 'Question', name: 'Do you offer refunds?', acceptedAnswer: { '@type': 'Answer', text: 'Monthly plans have a 5-day refund window after each billing date. Annual plans are eligible for a pro-rated refund based on unused months remaining.' } },
    { '@type': 'Question', name: 'What POS systems does BarGuard connect to?', acceptedAnswer: { '@type': 'Answer', text: "We currently support Square and Clover with full OAuth connections. More integrations are in progress. If you're on a different system, you can still import sales data manually via CSV upload." } },
    { '@type': 'Question', name: 'How does AI invoice scanning work?', acceptedAnswer: { '@type': 'Answer', text: 'Take a photo or upload a PDF of any delivery invoice. BarGuard sends it to Claude AI, which reads the vendor name, every line item, quantities, and unit costs. You review the extracted data, make any corrections, and confirm. It takes about 30 seconds versus 10 minutes of manual entry.' } },
    { '@type': 'Question', name: 'What is the difference between Basic and Pro?', acceptedAnswer: { '@type': 'Answer', text: 'Basic covers the core inventory workflow — tracking items, stock counts, AI invoice scanning, and variance reports with 30 days of sales history. Pro adds vendor management, automated reorder suggestions, POS integration, full sales history, and data export.' } },
    { '@type': 'Question', name: 'Can I track food items, not just alcohol?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. BarGuard supports spirits, beer, wine, food, produce, and any other inventory category. You can mix and match in the same account.' } },
    { '@type': 'Question', name: 'Can other bars see my data?', acceptedAnswer: { '@type': 'Answer', text: "No. Every bar account is completely isolated at the database level using row-level security. It is technically impossible for another bar's account to access your inventory, sales, or reports." } },
    { '@type': 'Question', name: 'Does BarGuard use my data to train AI models?', acceptedAnswer: { '@type': 'Answer', text: 'No. Your inventory data and stock counts stay in your account. The only data sent to an AI model is the invoice images you upload for scanning — and that is only used to extract the line items for that specific request.' } },
    { '@type': 'Question', name: 'What happens to my data if I cancel?', acceptedAnswer: { '@type': 'Answer', text: 'Your data is retained for 90 days after cancellation in case you reactivate. After 90 days it is permanently deleted. If you request deletion before the 90 days, we will delete it within 30 days.' } },
    { '@type': 'Question', name: 'How do I get help if something isn\'t working?', acceptedAnswer: { '@type': 'Answer', text: 'Email us at support@barguard.app. We typically respond within one business day. Enterprise plan customers receive priority response times.' } },
    { '@type': 'Question', name: 'Can I get help setting up my account?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — email support@barguard.app and we can walk you through getting your inventory entered, your POS connected, and your first variance report run.' } },
  ],
}

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <FAQClient />
    </>
  )
}
