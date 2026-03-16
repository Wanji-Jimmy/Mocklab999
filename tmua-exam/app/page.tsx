import Link from 'next/link'
import type { Metadata } from 'next'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'
import { absoluteUrl, SITE_NAME } from '@/lib/site'
import { TMUA_RESOURCE_GROUPS } from '@/lib/tmua-resources'

const HERO_FACTS = [
  { value: '2016-2023', label: 'Full paper coverage' },
  { value: '320', label: 'Official-style questions' },
  { value: '0-9', label: 'Grade conversion' },
  { value: 'Paper 2', label: 'Logic-heavy review focus' },
]

const PLATFORM_BLOCKS = [
  {
    title: 'Full timed mock workflow',
    description: 'Keep the exam engine exactly as it is and enter directly into year-based Paper 1 + Paper 2 sessions.',
  },
  {
    title: 'Score conversion and target planning',
    description: 'Turn a raw score into a grade band, then map that band to the next revision move.',
  },
  {
    title: 'Resources that tell you what to do next',
    description: 'Use focused TMUA guides instead of browsing generic admissions advice with no action path.',
  },
]

export const metadata: Metadata = {
  title: 'UK admissions test prep for TMUA applicants',
  description:
    'Use MockLab999 for timed TMUA mocks, score conversion, focused resources, and course-specific guides for high-intent applicants.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MockLab999 for TMUA applicants',
    description:
      'Timed TMUA mocks, score conversion, focused resources, and course-specific preparation pages in one platform.',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: 'MockLab999 for TMUA applicants',
    description:
      'Timed TMUA mocks, score conversion, focused resources, and course-specific preparation pages in one platform.',
  },
}

export default function Home() {
  const featuredGuides = ADMISSIONS_GUIDES.slice(0, 4)
  const featuredResources = TMUA_RESOURCE_GROUPS.flatMap((group) => group.items).slice(0, 3)
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description:
      'Timed TMUA mocks, score conversion, focused resources, and course-specific preparation pages in one platform.',
    inLanguage: 'en',
  }

  return (
    <main className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader active="home" />

        <RevealOnScroll>
          <section className="warm-card relative overflow-hidden rounded-[2rem] p-7 md:p-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/86" aria-hidden />
            <div className="relative z-10">
              <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                TMUA Preparation Platform
              </p>
              <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
                Timed TMUA mocks, score conversion, and clear next-step prep.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                MockLab999 stays focused on one job: help you sit full TMUA papers, read your score properly, and decide what
                to do before the next mock.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/dashboard" className="warm-primary-btn rounded-lg px-5 py-2.5">
                  Start Full Mock
                </Link>
                <Link href="/score-converter" className="warm-outline-btn rounded-lg px-5 py-2.5 font-semibold">
                  Convert My Score
                </Link>
                <Link href="/resources" className="warm-outline-btn rounded-lg px-5 py-2.5 font-semibold">
                  Open Resources
                </Link>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-4">
                {HERO_FACTS.map((fact) => (
                  <div key={fact.label} className="warm-card-muted rounded-2xl p-4">
                    <div className="warm-accent-text text-2xl font-black tracking-tight md:text-3xl">{fact.value}</div>
                    <div className="mt-1 text-xs text-slate-600 md:text-sm">{fact.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid gap-4 md:grid-cols-3">
            {PLATFORM_BLOCKS.map((block) => (
              <article key={block.title} className="warm-card rounded-2xl p-6 hover-lift">
                <h2 className="text-lg font-black text-slate-900">{block.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.description}</p>
              </article>
            ))}
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={130}>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="warm-card rounded-2xl p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Featured guides</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">High-intent TMUA pages for applicants</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {featuredGuides.map((guide) => (
                  <Link key={guide.slug} href={`/guides/${guide.slug}`} className="warm-card-muted rounded-2xl p-4 hover-lift">
                    <div className="text-sm font-bold text-slate-900">{guide.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600">{guide.description}</div>
                    <div className="mt-3 text-xs text-slate-500">Last updated: {guide.updatedAt}</div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="warm-card rounded-2xl p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Quick tools</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">What most students need next</h2>
              <div className="mt-5 space-y-3">
                {featuredResources.map((resource) => (
                  <Link key={resource.title} href={resource.href} className="warm-card-muted block rounded-2xl p-4 hover-lift">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">{resource.title}</div>
                      <div className="text-xs text-slate-500">{resource.readTime}</div>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600">{resource.description}</div>
                  </Link>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/score-converter" className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                  Open Score Converter
                </Link>
                <Link href="/resources" className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                  Browse Resources
                </Link>
              </div>
            </article>
          </section>
        </RevealOnScroll>
      </div>
    </main>
  )
}
