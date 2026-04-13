import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://barguard.app'

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/scan`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/features`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/partners`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog/bar-shrinkage-how-much-are-you-losing`, lastModified: new Date('2026-03-18'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog/bar-inventory-management-guide`, lastModified: new Date('2026-03-10'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog/over-pouring-bar-losses`, lastModified: new Date('2026-03-05'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog/bartender-theft-signs-prevention`, lastModified: new Date('2026-03-31'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog/how-to-reduce-liquor-cost-percentage`, lastModified: new Date('2026-04-07'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date('2026-03-18'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date('2026-04-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: new Date('2026-03-18'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/status`, lastModified: new Date(), changeFrequency: 'always', priority: 0.4 },
    // SEO landing pages
    { url: `${base}/bar-inventory-software`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/restaurant-inventory-software`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/bar-inventory-app`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/liquor-inventory-management`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/reduce-liquor-cost`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/stop-bartender-theft`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/bar-profit-tracking`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/automated-inventory-system`, lastModified: new Date('2026-04-12'), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
