'use client'

import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'
import SystemSwitchBar from '@/components/SystemSwitchBar'

const TRACKS = [
  {
    key: 'engaa',
    title: 'ENGAA 2016-2023',
    description: '8 year windows. Each year enters Paper 1 + Paper 2 with TMUA-like exam UI.',
    href: '/esat/engaa',
  },
  {
    key: 'nsaa',
    title: 'NSAA 2016-2023',
    description: '8 year windows, then choose Part B/C/D/E. Paper 1 is mandatory mathematics.',
    href: '/esat/nsaa',
  },
]

export default function EsatHomePage() {
  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />
      <div className="relative z-10 max-w-6xl mx-auto space-y-7">
        <header className="flex items-center justify-between gap-4">
          <MockLabLogo href="/" tone="warm" />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SystemSwitchBar active="esat" />
            <Link href="/" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Back to Entrance
            </Link>
          </div>
        </header>

        <RevealOnScroll>
          <section className="warm-card rounded-3xl p-7 md:p-9 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/86 via-white/80 to-white/88" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">ESAT Mock Hub</p>
              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">Choose ENGAA or NSAA</h1>
              <p className="mt-3 text-slate-600 max-w-4xl">ESAT routes are isolated from TMUA and have their own exam entry flow.</p>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid md:grid-cols-2 gap-4">
            {TRACKS.map((track) => (
              <article key={track.key} className="warm-card rounded-2xl p-6 hover-lift">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{track.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{track.description}</p>
                <Link href={track.href} className="warm-primary-btn mt-6 px-5 py-2.5 rounded-lg inline-flex">
                  Open {track.key.toUpperCase()}
                </Link>
              </article>
            ))}
          </section>
        </RevealOnScroll>
      </div>
    </div>
  )
}
