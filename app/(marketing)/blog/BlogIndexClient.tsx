'use client'

import Link from 'next/link'
import { POSTS } from './posts'

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Inventory Management': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  'Operations': { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Loss Prevention': { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Profitability': { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
}

export default function BlogIndexClient() {
  return (
    <div style={{ background: '#020817', minHeight: '100vh', paddingTop: 64 }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>

        {/* Hero */}
        <div style={{ paddingTop: 80, paddingBottom: 64, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BarGuard Blog</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, color: '#f8fafc', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>
            Bar Operations & Loss Prevention
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Practical guides for bar owners who want to reduce shrinkage, tighten inventory, and run a more profitable operation.
          </p>
        </div>

        {/* Posts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, paddingBottom: 100 }}>
          {POSTS.map((post) => {
            const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['Inventory Management']
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                data-gtm-event="blog_post_click"
                data-gtm-label={post.slug}
              >
                <article style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 18, padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#1e293b'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  {/* Category + read time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color, fontSize: 10, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{post.readTime}</span>
                  </div>

                  {/* Title */}
                  <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 18, fontWeight: 800, color: '#f8fafc', lineHeight: 1.3, marginBottom: 14, letterSpacing: '-0.3px' }}>
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, marginBottom: 24, flex: 1 }}>
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid #1e293b' }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>{post.date}</span>
                    <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read article
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                    </span>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        <style>{`
          @media (max-width: 860px) {
            .blog-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 560px) {
            .blog-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
