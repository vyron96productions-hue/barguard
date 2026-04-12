import { POSTS } from '@/app/(marketing)/blog/posts'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = 'https://barguard.app'

  const items = POSTS.map((post) => {
    const url = `${baseUrl}/blog/${post.slug}`
    const image = post.image ? `${baseUrl}${post.image}` : null

    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.metaDescription ?? post.excerpt}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${post.category}]]></category>
      ${image ? `<enclosure url="${image}" type="image/png" length="0" />` : ''}
      <media:content url="${image ?? ''}" medium="image" />
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BarGuard Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Bar inventory management tips, loss prevention strategies, and industry insights from BarGuard.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/og-image.png</url>
      <title>BarGuard Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
