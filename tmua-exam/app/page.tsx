'use client'

import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'

const EXAMS = [
  {
    key: 'tmua',
    title: 'TMUA System',
    subtitle: '数学能力模考系统（2016-2023）',
    href: '/dashboard',
    badge: 'TMUA',
    points: ['进入 TMUA 年份选择', 'Paper 1 + Paper 2', '成绩与错题复盘'],
    cta: '进入 TMUA 系统',
  },
  {
    key: 'esat',
    title: 'ESAT System',
    subtitle: 'ENGAA / NSAA 双入口模考系统',
    href: '/esat',
    badge: 'ESAT',
    points: ['进入 ESAT 选择页', 'ENGAA 2016-2023', 'NSAA 选科组合考试'],
    cta: '进入 ESAT 系统',
  },
]

export default function Home() {
  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-7">
        <header className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <div className="flex gap-2">
            <Link href="/account" className="warm-outline-btn px-4 py-2 rounded-lg font-semibold text-sm">
              My Account
            </Link>
            <Link href="/mistakes" className="warm-primary-btn px-4 py-2 rounded-lg text-sm">
              Mistake Center
            </Link>
          </div>
        </header>

        <RevealOnScroll>
          <section className="warm-card rounded-3xl p-7 md:p-10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/88" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">MockLab999</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">
                选择考试系统
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 max-w-4xl leading-relaxed">
                首页只做一件事：让你明确进入 TMUA 或 ESAT 两套独立系统。
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-3xl">
                <Link href="/dashboard" className="warm-primary-btn px-5 py-3 rounded-xl text-center font-bold">
                  打开 TMUA
                </Link>
                <Link href="/esat" className="warm-outline-btn px-5 py-3 rounded-xl text-center font-bold">
                  打开 ESAT
                </Link>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid md:grid-cols-2 gap-4">
            {EXAMS.map((exam) => (
              <article key={exam.key} className="warm-card rounded-2xl p-6 hover-lift">
                <p className="inline-flex warm-pill rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase">
                  {exam.badge}
                </p>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{exam.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{exam.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {exam.points.map((point) => (
                    <li key={point}>- {point}</li>
                  ))}
                </ul>
                <Link href={exam.href} className="warm-primary-btn mt-6 px-5 py-2.5 rounded-lg inline-flex">
                  {exam.cta}
                </Link>
              </article>
            ))}
          </section>
        </RevealOnScroll>
      </div>
    </div>
  )
}
