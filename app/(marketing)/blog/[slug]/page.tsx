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
    title: `${post.title} — BarGuard Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://barguard.app/blog/${slug}`,
      type: 'article',
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
