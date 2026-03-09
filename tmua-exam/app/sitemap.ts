import type { MetadataRoute } from 'next'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://mocklab999.com'
  const staticRoutes = [
    '/',
    '/dashboard',
    '/esat',
    '/esat/engaa',
    '/esat/nsaa',
    '/guides',
  ]

  const staticEntries = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.7,
  }))

  const guideEntries = ADMISSIONS_GUIDES.map((guide) => ({
    url: `${base}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...guideEntries]
}
