import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About BarGuard — Built by a Bar Owner, for Bar Owners',
  description: 'BarGuard was built by someone who spent their entire career in hospitality — bartending, managing, owning. This is why it exists and what makes it different.',
  openGraph: { url: 'https://barguard.app/about' },
}

export default function AboutPage() {
  return <AboutClient />
}
