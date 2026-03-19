import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/admin/', '/profile/', '/inventory/', '/sales/', '/purchase-scan/'],
    },
    sitemap: 'https://barguard.app/sitemap.xml',
  }
}
