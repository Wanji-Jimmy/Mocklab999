'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'
import SystemSwitchBar from '@/components/SystemSwitchBar'
import { getCurrentUserEmail, getExamAttempts, getMistakes, ExamAttempt } from '@/lib/storage'

const AVAILABLE_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
const SESSION_STORAGE_PREFIX = 'tmua_exam_session_'

interface YearProgress {
  answered: number
  state: string
  inProgress: boolean
  completed: boolean
}

type StoredSession = {
  state?: string
  paper1Answers?: Record<string, string>
  paper2Answers?: Record<string, string>
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [mistakeCount, setMistakeCount] = useState(0)
  const [yearProgress, setYearProgress] = useState<Record<number, YearProgress>>({})

  const refreshAccountSummary = () => {
    const current = getCurrentUserEmail()
    setEmail(current)
    if (!current) {
      setAttempts([])
      setMistakeCount(0)
      return
    }

    const allAttempts = getExamAttempts(current).sort((a, b) => b.takenAt.localeCompare(a.takenAt))
    setAttempts(allAttempts)
    setMistakeCount(getMistakes(current).length)
  }

  const refreshYearProgress = () => {
    const next: Record<number, YearProgress> = {}

    AVAILABLE_YEARS.forEach((year) => {
      const raw = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${year}`)
      if (!raw) {
        next[year] = { answered: 0, state: 'WELCOME', inProgress: false, completed: false }
        return
      }

      try {
        const parsed = JSON.parse(raw) as StoredSession
        const answeredP1 = Object.keys(parsed.paper1Answers || {}).length
        const answeredP2 = Object.keys(parsed.paper2Answers || {}).length
        const answered = answeredP1 + answeredP2
        const state = parsed.state || 'WELCOME'
        const completed = state === 'RESULT_SUMMARY'
        const inProgress = !completed && (answered > 0 || state !== 'WELCOME')

        next[year] = { answered, state, inProgress, completed }
      } catch {
        next[year] = { answered: 0, state: 'WELCOME', inProgress: false, completed: false }
      }
    })

    setYearProgress(next)
  }

  useEffect(() => {
    refreshAccountSummary()
  }, [])

  useEffect(() => {
    refreshYearProgress()

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (event.key.startsWith(SESSION_STORAGE_PREFIX)) {
        refreshYearProgress()
        return
      }
      if (
        event.key === 'tmua_user_email' ||
        event.key.startsWith('tmua_attempts_') ||
        event.key.startsWith('tmua_mistakes_')
      ) {
        refreshAccountSummary()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refreshYearProgress)
    window.addEventListener('focus', refreshAccountSummary)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refreshYearProgress)
      window.removeEventListener('focus', refreshAccountSummary)
    }
  }, [])

  const latestYear = useMemo(() => Math.max(...AVAILABLE_YEARS), [])
  const latestInProgressYear = useMemo(() => {
    const reversed = [...AVAILABLE_YEARS].reverse()
    return reversed.find((year) => yearProgress[year]?.inProgress)
  }, [yearProgress])
  const quickStartYear = latestInProgressYear ?? latestYear
  const attemptCount = attempts.length

  const clearYearProgress = (year: number) => {
    localStorage.removeItem(`${SESSION_STORAGE_PREFIX}${year}`)
    refreshYearProgress()
  }

  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-7">
        <header className="flex items-center justify-between gap-4">
          <MockLabLogo href="/" tone="warm" />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SystemSwitchBar active="tmua" />
            <Link href="/" className="warm-outline-btn px-4 py-2 rounded-lg font-semibold text-sm">
              System Entrance
            </Link>
            <Link href="/account" className="warm-primary-btn px-4 py-2 rounded-lg text-sm">
              My Account
            </Link>
          </div>
        </header>

        <RevealOnScroll>
          <section className="warm-card rounded-3xl p-7 md:p-9 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/86 via-white/80 to-white/88" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                Pre-Exam Hub
              </p>
              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">
                Choose Your Year, Enter Paper 1 and Paper 2, and Start the Full Mock Workflow
              </h1>
              <p className="mt-3 text-slate-600 max-w-4xl">
                Select any year from 2016 to 2023 and launch the timed two-paper exam. Results and mistakes sync to My Account.
              </p>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="warm-card-muted rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Account Status</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{email ? email : 'Not signed in'}</div>
                </div>
                <div className="warm-card-muted rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Mock Records</div>
                  <div className="text-2xl font-black warm-accent-text mt-1">{attemptCount}</div>
                </div>
                <div className="warm-card-muted rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Mistake Book</div>
                  <div className="text-2xl font-black warm-accent-text mt-1">{mistakeCount}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/exam/${quickStartYear}`} className="warm-primary-btn px-5 py-2.5 rounded-lg">
                  {latestInProgressYear ? `Resume ${latestInProgressYear}` : `Start Latest Year (${latestYear})`}
                </Link>
                <Link href="/account" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open My Account
                </Link>
                <Link href="/mistakes" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open Mistake Center
                </Link>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">TMUA Year Sets (2016-2023)</h2>
              <p className="text-sm text-slate-600">Each set includes Paper 1 + Paper 2, total 40 questions.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AVAILABLE_YEARS.map((year) => {
                const progress = yearProgress[year]
                return (
                  <div key={year} className="warm-card rounded-2xl p-5 text-center hover-lift">
                    <Link href={`/exam/${year}`} className="group block">
                      <div className="text-4xl font-black warm-accent-text transition-transform duration-200 group-hover:-translate-y-0.5">
                        {year}
                      </div>
                      <div className="text-xs md:text-sm text-slate-500 mt-2">Paper 1 + Paper 2</div>
                    </Link>
                    <div className="mt-2 text-xs text-slate-600">
                      {progress?.completed
                        ? 'Completed attempt saved'
                        : progress?.inProgress
                          ? `${progress.answered}/40 answered`
                          : 'No saved progress'}
                    </div>
                    <Link
                      href={`/exam/${year}`}
                      className="warm-primary-btn mt-4 text-xs px-3 py-1.5 rounded-lg inline-flex"
                    >
                      {progress?.inProgress ? 'Continue Mock' : 'Start Mock'}
                    </Link>
                    {(progress?.inProgress || progress?.completed) && (
                      <button
                        onClick={() => clearYearProgress(year)}
                        className="warm-outline-btn mt-2 text-xs px-3 py-1.5 rounded-lg"
                      >
                        Clear Progress
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </RevealOnScroll>
      </div>
    </div>
  )
}
