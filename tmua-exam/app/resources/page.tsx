import type { Metadata } from 'next'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { absoluteUrl, SITE_NAME } from '@/lib/site'
import { TMUA_RESOURCE_GROUPS } from '@/lib/tmua-resources'

export const metadata: Metadata = {
  title: 'TMUA Resources',
  description: 'Short TMUA preparation pages for Paper 2 logic, mock review, pacing, and score planning.',
  alternates: {
    canonical: '/resources',
  },
  openGraph: {
    title: `TMUA Resources | ${SITE_NAME}`,
    description: 'Short TMUA preparation pages for Paper 2 logic, mock review, pacing, and score planning.',
    url: absoluteUrl('/resources'),
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: `TMUA Resources | ${SITE_NAME}`,
    description: 'Short TMUA preparation pages for Paper 2 logic, mock review, pacing, and score planning.',
  },
}

export default function ResourcesPage() {
  return (
    <main className="warm-shell min-h-screen overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader active="resources" />

        <RevealOnScroll>
          <section className="warm-card rounded-[2rem] p-7 md:p-9">
            <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              TMUA Resources
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Short pages for what to do before the next TMUA mock.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              This hub is built for one use case: you finished a paper, you know something is weak, and you want a short next action
              instead of another vague study list.
            </p>
          </section>
        </RevealOnScroll>

        {TMUA_RESOURCE_GROUPS.map((group, index) => (
          <RevealOnScroll key={group.category} delayMs={90 + index * 40}>
            <section className="warm-card rounded-2xl p-6 md:p-7">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{group.category}</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{group.category} resources</h2>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{group.intro}</p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {group.items.map((item) => (
                  <article key={item.title} className="warm-card-muted rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                      <div className="text-xs text-slate-500">{item.readTime}</div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">Updated {item.updatedAt}</div>
                      <Link href={item.href} className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                        {item.cta}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </RevealOnScroll>
        ))}
      </div>
    </main>
  )
}
