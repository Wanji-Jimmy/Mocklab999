import type { Metadata } from 'next'
import ScoreConverterClient from '@/app/score-converter/ScoreConverterClient'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'TMUA Score Converter',
  description:
    'Convert a raw TMUA score into the current MockLab999 grade mapping and use the result to choose the next mock or review step.',
  alternates: {
    canonical: '/score-converter',
  },
  openGraph: {
    title: 'TMUA Score Converter | MockLab999',
    description:
      'Convert a raw TMUA score into the current MockLab999 grade mapping and use the result to choose the next mock or review step.',
    url: absoluteUrl('/score-converter'),
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: 'TMUA Score Converter | MockLab999',
    description:
      'Convert a raw TMUA score into the current MockLab999 grade mapping and use the result to choose the next mock or review step.',
  },
}

export default function ScoreConverterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TMUA Score Converter',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: absoluteUrl('/score-converter'),
    description:
      'A TMUA preparation tool that converts a raw score into the current MockLab999 grade mapping and suggests the next review action.',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScoreConverterClient />
    </>
  )
}
