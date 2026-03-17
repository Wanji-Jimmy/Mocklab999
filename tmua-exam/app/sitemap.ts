import type { MetadataRoute } from 'next'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'
import { absoluteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/dashboard',
    '/tmua/mock',
    '/tmua/papers',
    '/step',
    '/mat',
    '/score-converter',
    '/resources',
    '/guides',
    '/account',
    '/mistakes',
  ]

  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.7,
  }))

  const guideEntries = ADMISSIONS_GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...guideEntries]
}
