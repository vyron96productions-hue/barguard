import type { Metadata } from 'next'
import BlogIndexClient from './BlogIndexClient'

export const metadata: Metadata = {
  title: 'Blog — Bar Operations & Loss Prevention',
  description: 'Practical guides for bar owners on reducing shrinkage, managing inventory, preventing over-pouring, and running a more profitable bar operation.',
  alternates: { canonical: 'https://barguard.app/blog' },
  openGraph: { url: 'https://barguard.app/blog' },
}

export default function BlogPage() {
  return <BlogIndexClient />
}
