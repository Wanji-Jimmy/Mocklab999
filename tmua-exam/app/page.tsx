'use client'

import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'

const CORE_POINTS = [
  {
    title: 'Real TMUA Workflow',
    description: 'Full Paper 1 + Paper 2 sequencing with timed pressure and clean navigation.',
  },
  {
    title: 'Immediate Performance Clarity',
    description: 'Instant scoring, grade output, and question-level correctness review after submission.',
  },
  {
    title: 'Focused Weak-Point Training',
    description: 'Save mistakes in one click and revisit them inside your personal account workspace.',
  },
]

const METRICS = [
  { value: '2016-2023', label: 'Years Covered' },
  { value: '16', label: 'Papers' },
  { value: '320', label: 'Questions' },
  { value: '0-9', label: 'Grade Scale' },
]

export default function Home() {
  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <div className="flex gap-2">
            <Link href="/dashboard" className="warm-primary-btn px-4 py-2 rounded-lg text-sm">
              Enter Platform
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
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                TMUA Mock Platform
              </p>
              <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">
                MockLab999 for TMUA 2016-2023
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 max-w-4xl leading-relaxed">
                Run full Paper 1 + Paper 2 mocks, get instant scoring, and turn weak questions into a structured mistake book.
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
                  Open Mock Dashboard
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
      </div>
    </div>
  )
}
