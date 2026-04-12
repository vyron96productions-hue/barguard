import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About BarGuard — Built by a Bar Owner, for Bar Owners',
  description: 'BarGuard was built by someone who spent their entire career in hospitality — bartending, managing, owning. This is why it exists and what makes it different.',
  alternates: { canonical: 'https://barguard.app/about' },
  openGraph: {
    title: 'About BarGuard — Built by a Bar Owner, for Bar Owners',
    description: 'BarGuard was built by someone who spent their career in hospitality. Learn why it exists and what makes it different from generic inventory tools.',
    url: 'https://barguard.app/about',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function AboutPage() {
  return <AboutClient />
}
