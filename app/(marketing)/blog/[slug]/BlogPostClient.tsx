'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Post, Block } from '../posts'

// Map of slug → related slugs (hand-picked for topical relevance)
const RELATED: Record<string, string[]> = {
  'how-to-do-a-bar-inventory-count': ['bar-inventory-management-guide', 'bar-shrinkage-how-much-are-you-losing'],
  'bar-shrinkage-how-much-are-you-losing': ['bar-inventory-management-guide', 'bartender-theft-signs-prevention'],
  'bar-inventory-management-guide': ['bar-shrinkage-how-much-are-you-losing', 'how-to-do-a-bar-inventory-count'],
  'over-pouring-bar-losses': ['bar-shrinkage-how-much-are-you-losing', 'bar-inventory-management-guide'],
  'bartender-theft-signs-prevention': ['over-pouring-bar-losses', 'bar-shrinkage-how-much-are-you-losing'],
  'how-to-reduce-liquor-cost-percentage': ['over-pouring-bar-losses', 'bar-shrinkage-how-much-are-you-losing'],
  'stop-bartender-theft': ['bartender-theft-signs-prevention', 'bar-shrinkage-how-much-are-you-losing'],
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'p':
      return <p key={i} style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.8, marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: block.text }} />
    case 'h2':
      return <h2 key={i} style={{ fontFamily: 'var(--font-montserrat)', fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px', marginTop: 44, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}>{block.text}</h2>
    case 'h3':
      return <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginTop: 28, marginBottom: 12 }}>{block.text}</h3>
    case 'ul':
      return (
        <ul key={i} style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block.items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#cbd5e1', lineHeight: 1.65 }}>
              <span style={{ color: '#f59e0b', marginTop: 3, flexShrink: 0, fontSize: 12 }}>▸</span>
              {item}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={i} style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block.items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#cbd5e1', lineHeight: 1.65 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{j + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      )
    case 'callout':
      return (
        <div key={i} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '3px solid #f59e0b', borderRadius: '0 12px 12px 0', padding: '18px 22px', margin: '28px 0', fontSize: 15, color: '#fbbf24', lineHeight: 1.7, fontStyle: 'italic' }}>
          {block.text}
        </div>
      )
    case 'stats':
      return (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }} className="stats-grid">
          {block.items.map((stat, j) => (
            <div key={j} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.5px', marginBottom: 6 }}>{stat.number}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )
    case 'cta':
      return (
        <div key={i} style={{ background: 'linear-gradient(135deg, #0f172a 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '40px 36px', margin: '48px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Stop Leaving Money on the Table</div>
          <h3 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 14, lineHeight: 1.2 }}>
            BarGuard Catches What You Can't See
          </h3>
          <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 28, lineHeight: 1.65, maxWidth: 460, margin: '0 auto 28px' }}>
            Connect your POS, count your inventory, and let BarGuard show you exactly where the gaps are — automatically, every week.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary" data-gtm-event="blog_cta_click" data-gtm-label="blog_start_free" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 10 }}>
              Start Free — No Credit Card
            </Link>
            <Link href="/pricing" className="btn-secondary" data-gtm-event="blog_cta_click" data-gtm-label="blog_view_pricing" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 10 }}>
              See Pricing
            </Link>
          </div>
        </div>
      )
  }
}

export default function BlogPostClient({ post, allPosts = [] }: { post: Post; allPosts?: Post[] }) {
  const relatedSlugs = RELATED[post.slug] ?? []
  const relatedPosts = relatedSlugs.map(s => allPosts.find(p => p.slug === s)).filter(Boolean) as Post[]
  return (
    <div style={{ background: '#020817', minHeight: '100vh', paddingTop: 64 }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '60px 24px 100px' }}>

        {/* Back link */}
        <Link href="/blog" data-gtm-event="blog_back_click" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 40, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
          Back to Blog
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 10, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>
              {post.category}
            </span>
            <span style={{ fontSize: 13, color: '#475569' }}>{post.date}</span>
            <span style={{ fontSize: 13, color: '#475569' }}>·</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{post.readTime}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: 20 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.6, borderBottom: '1px solid #1e293b', paddingBottom: 32 }}>
            {post.excerpt}
          </p>
        </header>

        {/* Hero image */}
        {post.image && (
          <div style={{ marginBottom: 44, borderRadius: 16, overflow: 'hidden', border: '1px solid #1e293b' }}>
            <Image
              src={post.image}
              alt={post.imageAlt ?? post.title}
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <article>
          {post.content.map((block, i) => renderBlock(block, i))}
        </article>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Related Articles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {relatedPosts.map(rp => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, textDecoration: 'none', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4 }}>{rp.title}</span>
                  <span style={{ fontSize: 13, color: '#475569' }}>{rp.readTime} · {rp.category}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to blog */}
        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
            All articles
          </Link>
          <span style={{ fontSize: 13, color: '#334155' }}>BarGuard · barguard.app</span>
        </div>
      </div>

      <style>{`
        .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
