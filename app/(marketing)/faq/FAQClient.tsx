'use client'

import { useState } from 'react'

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What exactly does BarGuard do?',
        a: 'BarGuard tracks your bar\'s inventory and tells you exactly where product is going missing. You enter your stock counts before and after shifts, import your purchases, and BarGuard calculates the variance — what should have been used versus what actually disappeared. It flags which items are losing you money so you can act on it.',
      },
      {
        q: 'How long does setup take?',
        a: 'It depends on how many items you carry. A small bar with 30–40 products might take an hour to get everything entered. A full liquor program with 150+ items will take longer. The good news: you only do it once. After that, your daily workflow is just stock counts and scanning invoices.',
      },
      {
        q: 'Do I need any special hardware or equipment?',
        a: 'No. BarGuard runs entirely in your web browser on any device — phone, tablet, or computer. No scanners, no printers, no special equipment required. Your phone camera is all you need for invoice scanning.',
      },
      {
        q: 'Does my staff need training?',
        a: 'Minimal. Stock counts are straightforward — staff just enter quantities for each item. The AI invoice scanning is one button. The more complex reports and analysis are manager-level tools that one or two people need to learn.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    items: [
      {
        q: 'How does the free trial work?',
        a: 'Every new account gets 14 days of full access — no credit card required. You get everything including Pro features like POS integration and vendor management. At the end of 14 days, you choose a plan or your account is locked (your data is kept for 90 days).',
      },
      {
        q: 'Can I switch plans after signing up?',
        a: 'Yes, anytime. You can upgrade or downgrade from your profile page. Upgrades take effect immediately. Downgrades take effect at the start of your next billing period.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. No contracts, no cancellation fees. Cancel from your account settings and you keep access until the end of your current billing period. Your data is retained for 90 days after cancellation in case you change your mind.',
      },
      {
        q: 'What is the annual discount?',
        a: 'Paying annually saves 20% compared to monthly billing. Basic goes from $99/mo to $79/mo, Pro from $199/mo to $159/mo, and Enterprise from $399/mo to $319/mo. Annual plans are billed in full upfront and are eligible for pro-rated refunds if you cancel.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'Monthly plans have a 5-day refund window after each billing date. Annual plans are eligible for a pro-rated refund based on unused months remaining. See our Refund Policy for full details.',
      },
    ],
  },
  {
    category: 'Features & Integrations',
    items: [
      {
        q: 'What POS systems does BarGuard connect to?',
        a: 'We currently support Square and Clover with full OAuth connections. More integrations are in progress. If you\'re on a different system, you can still import sales data manually via CSV upload.',
      },
      {
        q: 'How does AI invoice scanning work?',
        a: 'Take a photo or upload a PDF of any delivery invoice. BarGuard sends it to Claude AI, which reads the vendor name, every line item, quantities, and unit costs. You review the extracted data, make any corrections, and confirm. It takes about 30 seconds versus 10 minutes of manual entry.',
      },
      {
        q: 'What is the difference between Basic and Pro?',
        a: 'Basic covers the core inventory workflow — tracking items, stock counts, AI invoice scanning, and variance reports with 30 days of sales history. Pro adds vendor management, automated reorder suggestions, POS integration, full sales history, and data export. Pro is for bars that want to fully automate their purchasing and connect their POS.',
      },
      {
        q: 'Does the variance calculation actually tell me who is stealing?',
        a: 'BarGuard tells you which items have more variance than expected and how much it\'s costing you. It can\'t tell you definitively whether the cause is theft, over-pouring, spillage, or recording errors — that\'s a judgment call that requires you to look at the patterns over time. What it does is make sure nothing slips through unnoticed.',
      },
      {
        q: 'Can I track food items, not just alcohol?',
        a: 'Yes. BarGuard supports spirits, beer, wine, food, produce, and any other inventory category. You can mix and match in the same account.',
      },
      {
        q: 'What happens if a menu item name in my POS doesn\'t match my inventory item name?',
        a: 'BarGuard has an alias system. When it encounters a name it doesn\'t recognize, it flags it on the Aliases page where you can map it to the correct inventory item. Once mapped, it remembers that connection forever.',
      },
    ],
  },
  {
    category: 'Data & Privacy',
    items: [
      {
        q: 'Can other bars see my data?',
        a: 'No. Every bar account is completely isolated at the database level using row-level security. It is technically impossible for another bar\'s account to access your inventory, sales, or reports.',
      },
      {
        q: 'Does BarGuard use my data to train AI models?',
        a: 'No. Your inventory data and stock counts stay in your account. The only data sent to an AI model is the invoice images you upload for scanning — and that is only used to extract the line items for that specific request.',
      },
      {
        q: 'What happens to my data if I cancel?',
        a: 'Your data is retained for 90 days after cancellation in case you reactivate. After 90 days it is permanently deleted. If you request deletion before the 90 days, we will delete it within 30 days.',
      },
    ],
  },
  {
    category: 'Support',
    items: [
      {
        q: 'How do I get help if something isn\'t working?',
        a: 'Email us at support@barguard.app. We typically respond within one business day. Enterprise plan customers receive priority response times.',
      },
      {
        q: 'Can I get help setting up my account?',
        a: 'Yes — email support@barguard.app and we can walk you through getting your inventory entered, your POS connected, and your first variance report run.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid #1e293b',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', gap: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: open ? '#f1f5f9' : '#94a3b8', lineHeight: 1.45, transition: 'color 0.2s' }}>{q}</p>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: open ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(245,158,11,0.3)' : '#1e293b'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            <path d="M2 4l4 4 4-4" stroke={open ? '#f59e0b' : '#475569'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {open && (
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, paddingBottom: 20, paddingRight: 44 }}>{a}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '72px 24px 100px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            FAQ
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.1, letterSpacing: '-1px', color: '#f8fafc', fontWeight: 800, marginBottom: 18 }}>
            Frequently asked <em style={{ color: '#f59e0b', fontStyle: 'italic' }}>questions</em>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.65 }}>
            Can't find what you're looking for? Email us at{' '}
            <a href="mailto:support@barguard.app" data-gtm-event="cta_click" data-gtm-label="faq_header_support_email" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@barguard.app</a>
          </p>
        </div>

        {/* FAQ Sections */}
        {FAQS.map((section) => (
          <div key={section.category} style={{ marginBottom: 52 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
              {section.category}
            </p>
            <div style={{ borderTop: '1px solid #1e293b' }}>
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ marginTop: 64, background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '40px 36px', textAlign: 'center' as const }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 24, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 12 }}>
            Still have questions?
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.65 }}>
            We're happy to walk you through anything before you sign up.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <a href="mailto:support@barguard.app" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="faq_cta_email" style={{ padding: '12px 24px', fontSize: 14 }}>
              Email us
            </a>
            <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="faq_cta_start_trial" style={{ padding: '12px 24px', fontSize: 14 }}>
              Start free trial
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
