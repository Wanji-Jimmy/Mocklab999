'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { TMUA_SCORE_BANDS } from '@/lib/tmua-resources'
import { GRADE_MAPPINGS, calculateGrade } from '@/lib/utils'

export default function ScoreConverterClient() {
  const [score, setScore] = useState(24)
  const grade = calculateGrade(score)
  const band = TMUA_SCORE_BANDS.find((item) => score >= item.min && score <= item.max) || TMUA_SCORE_BANDS[0]

  return (
    <main className="warm-shell min-h-screen overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader active="score-converter" />

        <RevealOnScroll>
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="warm-card rounded-[2rem] p-7 md:p-9">
              <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                TMUA Score Converter
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                Convert a raw TMUA score into a grade band and next-step plan.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                Use your last mock score to see where you are now, then choose the most useful next action instead of guessing.
              </p>

              <div className="mt-8">
                <div className="flex items-end justify-between gap-4">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="tmua-score-input">
                    Raw score
                  </label>
                  <div className="text-xs text-slate-500">Range: 0-40</div>
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    id="tmua-score-input"
                    type="number"
                    min={0}
                    max={40}
                    value={score}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value || '0', 10)
                      if (!Number.isFinite(next)) {
                        setScore(0)
                        return
                      }
                      setScore(Math.max(0, Math.min(40, next)))
                    }}
                    className="warm-focus-input w-28 rounded-xl border border-[#d7e4b5] bg-white/85 px-4 py-3 text-xl font-black text-slate-900"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={score}
                      onChange={(event) => setScore(Number.parseInt(event.target.value, 10))}
                      className="mt-4 w-full accent-[#d7b248]"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className="warm-card rounded-[2rem] p-7 md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Current reading</p>
              <div className="mt-3 flex items-end gap-3">
                <div className="warm-accent-text text-6xl font-black leading-none">{grade.toFixed(1)}</div>
                <div className="pb-1 text-lg font-bold text-slate-700">grade</div>
              </div>
              <div className="mt-5 rounded-2xl bg-white/65 p-4 ring-1 ring-[#dde7bc]">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{band.label}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{band.summary}</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="warm-card-muted rounded-2xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Focus now</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{band.focus}</p>
                </div>
                <div className="warm-card-muted rounded-2xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next action</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{band.nextAction}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/tmua/mock" className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                  Start full mock
                </Link>
                <Link href="/resources" className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                  Open resources
                </Link>
              </div>
            </article>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100}>
          <section className="warm-card rounded-2xl p-6 md:p-7">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Grade breakpoints</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">TMUA raw score to grade map</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                The converter uses your current site mapping. It is intended as a preparation planning tool, not as official admissions guidance.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {GRADE_MAPPINGS.map((mapping) => (
                <div
                  key={`${mapping.score}-${mapping.grade}`}
                  className={`rounded-2xl border px-4 py-4 ${
                    score >= mapping.score ? 'border-[#d9c257] bg-[#fff9de]' : 'border-[#d7e4b5] bg-white/70'
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Score at least</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{mapping.score}</div>
                  <div className="mt-1 text-sm text-slate-600">Grade {mapping.grade.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      </div>
    </main>
  )
}
