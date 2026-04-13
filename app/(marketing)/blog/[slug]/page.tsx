import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, POSTS } from '../posts'
import BlogPostClient from './BlogPostClient'

export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.metaTitle ?? `${post.title} — BarGuard Blog`,
    description: post.metaDescription ?? post.excerpt,
    alternates: { canonical: `https://barguard.app/blog/${slug}` },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
      url: `https://barguard.app/blog/${slug}`,
      type: 'article',
      siteName: 'BarGuard',
      images: post.image
        ? [{ url: `https://barguard.app${post.image}`, width: 1200, height: 630, alt: post.imageAlt ?? post.title }]
        : [{ url: 'https://barguard.app/Barguard_web_banner.webp', width: 1200, height: 630, alt: 'BarGuard — AI Bar Inventory Loss Detection Software' }],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  // Convert human-readable date (e.g. "March 18, 2026") to ISO 8601 for Schema.org
  const isoDate = new Date(post.date).toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: `https://barguard.app/blog/${slug}`,
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      '@type': 'Organization',
      name: 'BarGuard',
      url: 'https://barguard.app',
    },
    ...(post.image ? { image: { '@type': 'ImageObject', url: `https://barguard.app${post.image}`, width: 1200, height: 630 } } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'BarGuard',
      url: 'https://barguard.app',
      logo: { '@type': 'ImageObject', url: 'https://barguard.app/barguard_icon.png', width: 512, height: 512 },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <BlogPostClient post={post} allPosts={POSTS} />
    </>
  )
}
