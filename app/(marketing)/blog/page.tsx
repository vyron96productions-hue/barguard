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
    images: [{ url: 'https://barguard.app/Barguard_web_banner.webp', width: 1200, height: 630, alt: 'BarGuard — Bar Operations & Loss Prevention Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — Bar Operations & Loss Prevention',
    description: 'Practical guides for bar owners on reducing shrinkage, managing inventory, preventing over-pouring, and running a more profitable bar operation.',
    images: ['https://barguard.app/Barguard_web_banner.webp'],
  },
}

export default function BlogPage() {
  return <BlogIndexClient />
}
