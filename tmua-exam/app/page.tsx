'use client'

import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'

const CORE_POINTS = [
  {
    title: 'UK Admissions Test Prep',
    description: 'One platform for TMUA and ESAT preparation with pathway-based exam entry.',
  },
  {
    title: 'Account-Based Progress',
    description: 'Your attempts and mistakes are tied to account sessions for cross-device continuity.',
  },
  {
    title: 'High-Intent Content Pages',
    description: 'University-course guides designed for applicants searching exact requirements and pathways.',
  },
]

const METRICS = [
  { value: 'TMUA', label: 'Admissions Track' },
  { value: 'ESAT', label: 'Admissions Track' },
  { value: 'Account', label: 'Cross-Device History' },
  { value: '10', label: 'High-Intent Guides' },
]

export default function Home() {
  const topGuides = ADMISSIONS_GUIDES.slice(0, 10)
  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <div className="flex gap-2">
            <Link href="/dashboard" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              TMUA
            </Link>
            <Link href="/esat" className="warm-primary-btn px-4 py-2 rounded-lg text-sm">
              ESAT
            </Link>
            <Link href="/account" className="warm-outline-btn px-4 py-2 rounded-lg font-semibold text-sm">
              My Account
            </Link>
          </div>
        </header>

        <RevealOnScroll>
          <section className="warm-card rounded-3xl p-7 md:p-10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/88" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">MockLab999</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">
                UK Admissions Test Preparation Platform
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 max-w-4xl leading-relaxed">
                Prepare for UK admissions tests with realistic mocks, course-specific pathways, and weakness diagnosis.
              </p>

              <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
                {METRICS.map((metric) => (
                  <div key={metric.label} className="warm-card-muted rounded-xl p-4">
                    <div className="text-2xl md:text-3xl font-black warm-accent-text tracking-tight">{metric.value}</div>
                    <div className="text-xs md:text-sm text-slate-600 mt-1">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/dashboard" className="warm-primary-btn px-5 py-2.5 rounded-lg">
                  Open TMUA
                </Link>
                <Link href="/esat" className="warm-primary-btn px-5 py-2.5 rounded-lg">
                  Open ESAT
                </Link>
                <Link href="/guides" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open Admissions Guides
                </Link>
                <Link href="/account" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open My Account
                </Link>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid md:grid-cols-3 gap-4">
            {CORE_POINTS.map((point) => (
              <div key={point.title} className="warm-card rounded-2xl p-5 hover-lift">
                <h2 className="text-base font-bold text-slate-900">{point.title}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{point.description}</p>
              </div>
            ))}
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={130}>
          <section className="warm-card rounded-2xl p-6">
            <h2 className="text-2xl font-black text-slate-900">High-Intent Admissions Pages</h2>
            <p className="text-slate-600 mt-2">
              Built for course-level search demand across Cambridge, UCL, Imperial, LSE, and Warwick pathways.
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              {topGuides.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} className="warm-card-muted rounded-xl p-4 hover-lift">
                  <div className="font-semibold text-slate-900">{guide.title}</div>
                  <div className="text-sm text-slate-600 mt-1">Last updated: {guide.updatedAt}</div>
                </Link>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      </div>
    </div>
  )
}
