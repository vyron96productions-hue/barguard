import type { Metadata } from 'next'
import BlogIndexClient from './BlogIndexClient'

export const metadata: Metadata = {
  title: 'Blog — Bar Operations & Loss Prevention',
  description: 'Practical guides for bar owners on reducing shrinkage, managing inventory, preventing over-pouring, and running a more profitable bar operation.',
  alternates: { canonical: 'https://barguard.app/blog' },
  openGraph: {
    title: 'Blog — Bar Operations & Loss Prevention',
    description: 'Practical guides for bar owners on reducing shrinkage, managing inventory, preventing over-pouring, and running a more profitable bar operation.',
    url: 'https://barguard.app/blog',
    type: 'website',
    siteName: 'BarGuard',
    images: [{ url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512, alt: 'BarGuard' }],
  },
}

export default function BlogPage() {
  return <BlogIndexClient />
}
