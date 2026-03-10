import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ADMISSIONS_GUIDES, getGuideBySlug } from '@/lib/admissions-guides'

export function generateStaticParams() {
  return ADMISSIONS_GUIDES.map((guide) => ({ slug: guide.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuideBySlug(params.slug)
  if (!guide) {
    return { title: 'Guide Not Found | MockLab999' }
  }
  return {
    title: `${guide.title} | MockLab999`,
    description: guide.description,
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

  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="warm-card rounded-2xl p-6 md:p-8">
          <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">Admissions Guide</p>
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
            <Link href="/dashboard" className="warm-primary-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Open TMUA Workflow
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
