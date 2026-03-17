import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { MAT_MANIFEST, STEP_MANIFEST, TMUA_MANIFEST, uniqueYears } from '@/lib/admissions-library'

const MODULES = [
  {
    title: 'TMUA Mock',
    description: 'Enter the existing TMUA mock engine with year-based Paper 1 + Paper 2 sessions.',
    href: '/tmua/mock',
    stat: '2016-2023',
    detail: 'Full timed mock workflow',
  },
  {
    title: 'TMUA Papers',
    description: 'Browse locally hosted official TMUA papers, worked answers, and answer keys, with direct entry into the exam engine.',
    href: '/tmua/papers',
    stat: `${TMUA_MANIFEST.count} files`,
    detail: `${uniqueYears(TMUA_MANIFEST.items).slice(-1)[0]}-${uniqueYears(TMUA_MANIFEST.items)[0]} + specimen`,
  },
  {
    title: 'STEP Papers & Solutions',
    description: 'Browse locally hosted STEP papers, reports, hints, solutions, and specification files.',
    href: '/step',
    stat: `${STEP_MANIFEST.count} files`,
    detail: `${uniqueYears(STEP_MANIFEST.items).slice(-1)[0]}-${uniqueYears(STEP_MANIFEST.items)[0]}`,
  },
  {
    title: 'MAT Papers & Solutions',
    description: 'Browse locally hosted MAT papers, reports, official solutions, and specimen material.',
    href: '/mat',
    stat: `${MAT_MANIFEST.count} files`,
    detail: `${uniqueYears(MAT_MANIFEST.items).slice(-1)[0]}-${uniqueYears(MAT_MANIFEST.items)[0]}`,
  },
  {
    title: 'Personalization',
    description: 'Open your account workspace, saved attempts, mistake book, and revision history.',
    href: '/account',
    stat: 'Account',
    detail: 'Personal records',
  },
] as const

export const metadata = {
  title: 'Platform Hub',
  description: 'Choose between TMUA mock, TMUA papers, STEP papers, MAT papers, and your personal workspace.',
}

export default function DashboardPage() {
  return (
    <main className="warm-shell min-h-screen overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader active="dashboard" />

        <RevealOnScroll>
          <section className="warm-card rounded-[2rem] p-7 md:p-9">
            <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              Platform Modules
            </p>
            <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Choose the exact system you want: TMUA mock, TMUA papers, STEP library, MAT library, or your personal workspace.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              The TMUA mock engine stays inside its own module. STEP and MAT are handled as local paper-and-solution libraries, so their files are separate from the mock system.
            </p>
          </section>
        </RevealOnScroll>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module, index) => (
            <RevealOnScroll key={module.title} delayMs={80 + index * 35}>
              <article className="warm-card rounded-2xl p-6 hover-lift h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{module.stat}</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">{module.title}</h2>
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-[#dbe8b6]">
                    {module.detail}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{module.description}</p>
                <Link href={module.href} className="warm-primary-btn mt-6 rounded-lg px-4 py-2.5 text-sm">
                  Open module
                </Link>
              </article>
            </RevealOnScroll>
          ))}
        </section>
      </div>
    </main>
  )
}
