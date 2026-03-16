import type { Metadata } from 'next'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'TMUA Guides',
  description: 'Course-specific TMUA guides for applicants targeting Cambridge, UCL, LSE, Warwick, Durham, and related pathways.',
  alternates: {
    canonical: '/guides',
  },
  openGraph: {
    title: `TMUA Guides | ${SITE_NAME}`,
    description:
      'Course-specific TMUA guides for applicants targeting Cambridge, UCL, LSE, Warwick, Durham, and related pathways.',
    url: absoluteUrl('/guides'),
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: `TMUA Guides | ${SITE_NAME}`,
    description:
      'Course-specific TMUA guides for applicants targeting Cambridge, UCL, LSE, Warwick, Durham, and related pathways.',
  },
}

export default function GuidesIndexPage() {
  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <TmuaSiteHeader active="guides" />

        <RevealOnScroll>
          <header className="warm-card rounded-[2rem] p-6 md:p-8">
            <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">TMUA Guides</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-black text-slate-900">High-intent pages for applicants who need TMUA clarity fast.</h1>
            <p className="mt-3 text-slate-600 max-w-4xl">
              These pages are written for students who already know TMUA matters and want to connect score planning, full mocks, and course-specific preparation.
            </p>
          </header>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid md:grid-cols-2 gap-4">
            {ADMISSIONS_GUIDES.map((guide) => (
              <article key={guide.slug} className="warm-card rounded-2xl p-6 hover-lift">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900">{guide.title}</h2>
                  <div className="text-xs text-slate-500 whitespace-nowrap">{guide.updatedAt}</div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{guide.description}</p>
                <div className="mt-3 text-xs text-slate-500">Primary: {guide.primaryTest}</div>
                <Link href={`/guides/${guide.slug}`} className="warm-primary-btn mt-5 px-4 py-2 rounded-lg inline-flex text-sm">
                  Read guide
                </Link>
              </article>
            ))}
          </section>
        </RevealOnScroll>
      </div>
    </main>
  )
}
