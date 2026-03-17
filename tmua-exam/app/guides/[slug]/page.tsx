import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { ADMISSIONS_GUIDES, getGuideBySlug } from '@/lib/admissions-guides'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export function generateStaticParams() {
  return ADMISSIONS_GUIDES.map((guide) => ({ slug: guide.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuideBySlug(params.slug)
  if (!guide) {
    return { title: 'Guide Not Found' }
  }
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.title} | ${SITE_NAME}`,
      description: guide.description,
      url: absoluteUrl(`/guides/${guide.slug}`),
      siteName: SITE_NAME,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${guide.title} | ${SITE_NAME}`,
      description: guide.description,
    },
  }
}

export default function GuideDetailPage({ params }: { params: { slug: string } }) {
  const guide = getGuideBySlug(params.slug)
  if (!guide) {
    notFound()
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: absoluteUrl('/guides'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: absoluteUrl(`/guides/${guide.slug}`),
      },
    ],
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    dateModified: guide.updatedAt,
    datePublished: guide.updatedAt,
    mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
    about: guide.primaryTest,
  }

  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <TmuaSiteHeader active="guides" />

        <header className="warm-card rounded-2xl p-6 md:p-8">
          <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">TMUA Admissions Guide</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900">{guide.title}</h1>
          <p className="mt-3 text-slate-600">{guide.description}</p>
          <div className="mt-4 text-sm text-slate-700">Audience: {guide.audience}</div>
          <div className="mt-1 text-sm text-slate-700">
            Primary Test: <span className="font-semibold">{guide.primaryTest}</span>
          </div>
          {guide.secondaryTests && guide.secondaryTests.length > 0 && (
            <div className="mt-1 text-sm text-slate-700">Related: {guide.secondaryTests.join(', ')}</div>
          )}
          <div className="mt-1 text-xs text-slate-500">Last updated: {guide.updatedAt}</div>
        </header>

        <section className="warm-card rounded-2xl p-6">
          <h2 className="text-xl font-black text-slate-900">Preparation Focus</h2>
          <ul className="mt-3 space-y-2 text-slate-700">
            {guide.keyPoints.map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
        </section>

        <section className="warm-card rounded-2xl p-6">
          <h2 className="text-xl font-black text-slate-900">FAQ</h2>
          <div className="mt-3 space-y-4">
            {guide.faq.map((item) => (
              <article key={item.question}>
                <h3 className="font-bold text-slate-900">{item.question}</h3>
                <p className="mt-1 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="warm-card rounded-2xl p-6">
          <h2 className="text-xl font-black text-slate-900">Next Step</h2>
          <p className="mt-2 text-slate-700">
            Confirm your target course requirements, run a timed TMUA mock, then review mistakes before planning the next paper.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/tmua/mock" className="warm-primary-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Open full mock
            </Link>
            <Link href="/score-converter" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Convert a score
            </Link>
            <Link href="/resources" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Read resources
            </Link>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/guides" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
            Back to All Guides
          </Link>
          <Link href="/" className="warm-primary-btn px-4 py-2 rounded-lg text-sm font-semibold">
            Go to Platform Home
          </Link>
        </div>
      </div>
    </main>
  )
}
