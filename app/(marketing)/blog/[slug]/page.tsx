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
      ...(post.image ? { images: [{ url: `https://barguard.app${post.image}`, width: 1200, height: 630 }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: `https://barguard.app/blog/${slug}`,
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'BarGuard',
      url: 'https://barguard.app',
      logo: { '@type': 'ImageObject', url: 'https://barguard.app/barguard_icon.png' },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <BlogPostClient post={post} allPosts={POSTS} />
    </>
  )
}
