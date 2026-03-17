'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { fetchAttemptsV2, fetchAuthMe, fetchMistakesV2 } from '@/lib/client-api'
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [mistakeCount, setMistakeCount] = useState(0)
  const [yearProgress, setYearProgress] = useState<Record<number, YearProgress>>({})
  const [usingLocalFallback, setUsingLocalFallback] = useState(false)

  const refreshAccountSummary = async () => {
    const serverUser = await fetchAuthMe().catch(() => null)
    if (serverUser?.email) {
      setEmail(serverUser.email)
      setIsAdmin(Boolean(serverUser.isAdmin))
      try {
        const [serverAttempts, serverMistakes] = await Promise.all([fetchAttemptsV2(), fetchMistakesV2()])
        setAttempts(serverAttempts.sort((a, b) => b.takenAt.localeCompare(a.takenAt)))
        setMistakeCount(serverMistakes.length)
        setUsingLocalFallback(false)
      } catch {
        const current = getCurrentUserEmail()
        const allAttempts = current ? getExamAttempts(current).sort((a, b) => b.takenAt.localeCompare(a.takenAt)) : []
        setAttempts(allAttempts)
        setMistakeCount(current ? getMistakes(current).length : 0)
        setUsingLocalFallback(true)
      }
      return
    }

    const current = getCurrentUserEmail()
    setEmail(current)
    setIsAdmin(false)
    setUsingLocalFallback(Boolean(current))
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
    void refreshAccountSummary()
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
        void refreshAccountSummary()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refreshYearProgress)
    const onFocusAccount = () => {
      void refreshAccountSummary()
    }
    window.addEventListener('focus', onFocusAccount)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refreshYearProgress)
      window.removeEventListener('focus', onFocusAccount)
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
        <TmuaSiteHeader active="tmua-mock" />

        <RevealOnScroll>
          <section className="warm-card rounded-3xl p-7 md:p-9 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/86 via-white/80 to-white/88" aria-hidden />
            <div className="relative z-10">
              <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                TMUA Mock
              </p>
              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl">
                Choose a year, resume saved progress, or enter the existing TMUA full mock workflow.
              </h1>
              <p className="mt-3 text-slate-600 max-w-4xl">
                The mock engine stays unchanged. This page is where you pick the next TMUA year set, check your current position, and launch the same Paper 1 + Paper 2 workflow as before.
              </p>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="warm-card-muted rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Account Status</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{email ? email : 'Not signed in'}</div>
                  {usingLocalFallback && (
                    <div className="text-[11px] text-amber-700 mt-1">Offline fallback: showing local cached records.</div>
                  )}
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
                <Link href="/score-converter" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Convert a Score
                </Link>
                <Link href="/resources" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open Resources
                </Link>
                <Link href="/account" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open My Account
                </Link>
                <Link href="/mistakes" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                  Open Mistake Center
                </Link>
                {isAdmin && (
                  <Link href="/admin/uploads" className="warm-outline-btn px-5 py-2.5 rounded-lg font-semibold">
                    Admin Uploads
                  </Link>
                )}
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={90}>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="warm-card rounded-2xl p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Quick Tool</div>
              <h2 className="mt-2 text-lg font-black text-slate-900">Score converter</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Turn your raw TMUA score into a grade band and use that band to decide the next revision move.
              </p>
              <Link href="/score-converter" className="warm-primary-btn mt-4 rounded-lg px-4 py-2 text-sm">
                Open converter
              </Link>
            </article>
            <article className="warm-card rounded-2xl p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Quick Tool</div>
              <h2 className="mt-2 text-lg font-black text-slate-900">Resources</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Read short pages on Paper 2 logic, mock review, and how to turn each paper into a cleaner next step.
              </p>
              <Link href="/resources" className="warm-primary-btn mt-4 rounded-lg px-4 py-2 text-sm">
                Browse resources
              </Link>
            </article>
            <article className="warm-card rounded-2xl p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Quick Tool</div>
              <h2 className="mt-2 text-lg font-black text-slate-900">Admissions guides</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Use course-level TMUA pages for Cambridge, UCL, LSE, Warwick, Durham, and related pathways.
              </p>
              <Link href="/guides" className="warm-primary-btn mt-4 rounded-lg px-4 py-2 text-sm">
                Read guides
              </Link>
            </article>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={130}>
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
