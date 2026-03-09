'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import LatexRenderer from '@/components/LatexRenderer'
import MockLabLogo from '@/components/MockLabLogo'
import { Question } from '@/lib/types'
import { clearMistakes, getCurrentUserEmail, getMistakes, MistakeItem, removeMistake } from '@/lib/storage'

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
const MISTAKES_UI_PREFS_KEY = 'tmua_mistakes_ui_prefs_v1'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

function toCsvCell(value: unknown): string {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export default function MistakesPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState<MistakeItem[]>([])
  const [yearFilter, setYearFilter] = useState('ALL')
  const [paperFilter, setPaperFilter] = useState<'ALL' | '1' | '2'>('ALL')
  const [queryFilter, setQueryFilter] = useState('')
  const [mistakeJumpInput, setMistakeJumpInput] = useState('')
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null)
  const [questionsByYear, setQuestionsByYear] = useState<Record<string, Question[]>>({})
  const [loadingYear, setLoadingYear] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [stemImageFailed, setStemImageFailed] = useState(false)
  const [explanationImageFailed, setExplanationImageFailed] = useState(false)

  const load = useCallback(() => {
    const currentEmail = getCurrentUserEmail()
    setEmail(currentEmail)
    if (!currentEmail) {
      setMistakes([])
      return
    }
    setMistakes(getMistakes(currentEmail))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MISTAKES_UI_PREFS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        yearFilter?: string
        paperFilter?: 'ALL' | '1' | '2'
        queryFilter?: string
      }

      if (typeof parsed.yearFilter === 'string' && (parsed.yearFilter === 'ALL' || YEARS.includes(parsed.yearFilter))) {
        setYearFilter(parsed.yearFilter)
      }
      if (parsed.paperFilter === 'ALL' || parsed.paperFilter === '1' || parsed.paperFilter === '2') {
        setPaperFilter(parsed.paperFilter)
      }
      if (typeof parsed.queryFilter === 'string') setQueryFilter(parsed.queryFilter)
    } catch {
      // Ignore malformed preference payloads from previous builds.
    }
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (event.key === 'tmua_user_email' || event.key.startsWith('tmua_mistakes_')) {
        load()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', load)
    }
  }, [load])

  useEffect(() => {
    const payload = { yearFilter, paperFilter, queryFilter }
    localStorage.setItem(MISTAKES_UI_PREFS_KEY, JSON.stringify(payload))
  }, [yearFilter, paperFilter, queryFilter])

  const filtered = useMemo(() => {
    const normalizedQuery = queryFilter.trim().toLowerCase()

    return mistakes
      .filter((m) => (yearFilter === 'ALL' ? true : m.year === yearFilter))
      .filter((m) => (paperFilter === 'ALL' ? true : String(m.paper) === paperFilter))
      .filter((m) => {
        if (!normalizedQuery) return true
        const searchable = `${m.id} ${m.year} p${m.paper} q${m.index + 1}`.toLowerCase()
        return searchable.includes(normalizedQuery)
      })
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  }, [mistakes, yearFilter, paperFilter, queryFilter])

  const selectedMistake = useMemo(() => {
    if (!selectedMistakeId) return null
    return filtered.find((item) => item.id === selectedMistakeId) ?? null
  }, [filtered, selectedMistakeId])

  const selectedMistakeIndex = useMemo(() => {
    if (!selectedMistakeId) return -1
    return filtered.findIndex((item) => item.id === selectedMistakeId)
  }, [filtered, selectedMistakeId])

  const selectedQuestion = useMemo(() => {
    if (!selectedMistake) return null
    const yearQuestions = questionsByYear[selectedMistake.year] || []
    return yearQuestions.find((question) => question.id === selectedMistake.id) || null
  }, [questionsByYear, selectedMistake])

  const loadYearQuestions = useCallback(async (year: string) => {
    if (questionsByYear[year]) return
    setLoadingYear(year)
    setDetailError(null)
    try {
      const response = await fetch(`/api/questions?year=${year}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = (await response.json()) as Question[]
      if (!Array.isArray(payload) || payload.length === 0) throw new Error('No questions found')
      const sorted = [...payload].sort((a, b) => {
        if (a.paper !== b.paper) return a.paper - b.paper
        return a.index - b.index
      })
      setQuestionsByYear((prev) => ({ ...prev, [year]: sorted }))
    } catch {
      setDetailError(`Failed to load question details for ${year}.`)
    } finally {
      setLoadingYear((prev) => (prev === year ? null : prev))
    }
  }, [questionsByYear])

  const handleRemove = (questionId: string) => {
    if (!email) return
    if (!window.confirm('Remove this question from your mistake book?')) return
    removeMistake(email, questionId)
    load()
    setInfoMessage('Question removed.')
  }

  const handleRemoveFiltered = () => {
    if (!email) return
    if (!window.confirm(`Remove ${filtered.length} filtered item(s)?`)) return
    filtered.forEach((item) => removeMistake(email, item.id))
    load()
    setInfoMessage('Filtered mistakes removed.')
  }

  const handleClearAll = () => {
    if (!email) return
    if (!window.confirm('Clear all mistakes? This cannot be undone.')) return
    clearMistakes(email)
    load()
    setInfoMessage('All mistakes cleared.')
  }

  const handleExportFilteredCsv = () => {
    if (!email) return
    if (filtered.length === 0) {
      setInfoMessage('No filtered mistakes available for CSV export.')
      return
    }

    const rows = [
      ['Question ID', 'Year', 'Paper', 'Question', 'Saved At'],
      ...filtered.map((item) => [item.id, item.year, item.paper, item.index + 1, item.addedAt]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-mistakes-filtered-${email.replace(/[^a-z0-9]/gi, '_')}-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setInfoMessage('Filtered mistakes CSV downloaded.')
  }

  const handleSelectPrevious = () => {
    if (selectedMistakeIndex <= 0) return
    setSelectedMistakeId(filtered[selectedMistakeIndex - 1].id)
  }

  const handleSelectNext = () => {
    if (selectedMistakeIndex < 0 || selectedMistakeIndex >= filtered.length - 1) return
    setSelectedMistakeId(filtered[selectedMistakeIndex + 1].id)
  }

  const handleJumpToMistakePosition = () => {
    if (filtered.length === 0) return
    const parsed = Number.parseInt(mistakeJumpInput.trim(), 10)
    if (!Number.isFinite(parsed)) {
      setInfoMessage('Enter a valid mistake number to jump.')
      return
    }
    if (parsed < 1 || parsed > filtered.length) {
      setInfoMessage(`Jump target must be between 1 and ${filtered.length}.`)
      return
    }
    setSelectedMistakeId(filtered[parsed - 1].id)
    setMistakeJumpInput('')
  }

  const handleResetFilters = () => {
    setYearFilter('ALL')
    setPaperFilter('ALL')
    setQueryFilter('')
    setMistakeJumpInput('')
  }

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedMistakeId(null)
      return
    }
    if (!selectedMistakeId || !filtered.some((item) => item.id === selectedMistakeId)) {
      setSelectedMistakeId(filtered[0].id)
    }
  }, [filtered, selectedMistakeId])

  useEffect(() => {
    setMistakeJumpInput('')
  }, [yearFilter, paperFilter, queryFilter])

  useEffect(() => {
    if (!selectedMistake) return
    void loadYearQuestions(selectedMistake.year)
  }, [selectedMistake, loadYearQuestions])

  useEffect(() => {
    setStemImageFailed(false)
    setExplanationImageFailed(false)
  }, [selectedQuestion?.id])

  useEffect(() => {
    if (!infoMessage) return
    const timer = window.setTimeout(() => setInfoMessage(null), 2200)
    return () => window.clearTimeout(timer)
  }, [infoMessage])

  useEffect(() => {
    if (!selectedMistake || filtered.length === 0) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

      if (event.key === 'ArrowLeft') {
        if (selectedMistakeIndex <= 0) return
        event.preventDefault()
        setSelectedMistakeId(filtered[selectedMistakeIndex - 1].id)
        return
      }

      if (selectedMistakeIndex < 0 || selectedMistakeIndex >= filtered.length - 1) return
      event.preventDefault()
      setSelectedMistakeId(filtered[selectedMistakeIndex + 1].id)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedMistake, filtered, selectedMistakeIndex])

  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop tone="warm" />
      <div className="relative z-10 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <Link href="/dashboard" className="warm-outline-btn px-4 py-2 rounded-lg text-sm">
            Back Dashboard
          </Link>
        </div>

        <header className="warm-card rounded-3xl p-6 md:p-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Personal Practice</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">Mistake Center</h1>
            <p className="mt-2 text-slate-600">Track weak points, reopen exact questions, and clean up your mistake list quickly.</p>
          </div>
        </header>

        {!email && (
          <div className="warm-card rounded-2xl p-6">
            <p className="text-slate-700">Please sign in on the My Account page to access your mistake center.</p>
            <Link href="/account" className="inline-block mt-3 text-sm warm-link-text">
              Go to My Account
            </Link>
          </div>
        )}

        {email && (
          <>
            <section className="warm-card rounded-2xl p-5 md:p-6 flex flex-wrap gap-3 items-center">
              <div className="text-sm text-slate-600 mr-2">
                Signed in as <span className="font-semibold text-slate-900">{email}</span>
              </div>
              <input
                value={queryFilter}
                onChange={(e) => setQueryFilter(e.target.value)}
                placeholder="Search ID, year, paper, question..."
                className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm min-w-[230px]"
              />
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
              >
                <option value="ALL">All Years</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={paperFilter}
                onChange={(e) => setPaperFilter(e.target.value as 'ALL' | '1' | '2')}
                className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
              >
                <option value="ALL">All Papers</option>
                <option value="1">Paper 1</option>
                <option value="2">Paper 2</option>
              </select>
              <button
                onClick={handleExportFilteredCsv}
                disabled={filtered.length === 0}
                className="warm-outline-btn px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Export Filtered CSV
              </button>
              <button
                onClick={handleResetFilters}
                className="warm-outline-btn px-3 py-2 rounded-lg text-sm"
              >
                Reset Filters
              </button>
              <button
                onClick={handleRemoveFiltered}
                disabled={filtered.length === 0}
                className="warm-outline-btn px-3 py-2 border border-red-200 text-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 text-sm"
              >
                Remove Filtered
              </button>
              <button
                onClick={handleClearAll}
                disabled={mistakes.length === 0}
                className="warm-outline-btn px-3 py-2 border border-red-200 text-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 text-sm"
              >
                Clear All
              </button>
              <div className="ml-auto text-sm text-slate-500">{filtered.length} item{filtered.length === 1 ? '' : 's'}</div>
            </section>

            <section className="warm-card rounded-2xl p-5 md:p-6">
              {filtered.length === 0 ? (
                <p className="text-slate-600">No mistakes match your current filters.</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
                        selectedMistakeId === m.id
                          ? 'border-slate-700 bg-white'
                          : 'border-slate-200 bg-slate-50/75'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{m.year} Paper {m.paper} Question {m.index + 1}</div>
                        <div className="text-xs text-slate-500 mt-1">Saved {new Date(m.addedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedMistakeId(m.id)}
                          className="warm-outline-btn px-3 py-2 rounded-md text-sm"
                        >
                          View
                        </button>
                        <Link
                          href={`/exam/${m.year}?paper=${m.paper}&q=${m.index + 1}`}
                          className="warm-primary-btn px-3 py-2 rounded-md text-sm"
                        >
                          Open Question
                        </Link>
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="warm-outline-btn px-3 py-2 rounded-md text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {selectedMistake && (
              <section className="warm-card rounded-2xl p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900 text-xl">
                      Mistake Detail · {selectedMistake.year} Paper {selectedMistake.paper} Question {selectedMistake.index + 1}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">Review question, options, and explanation in one place.</p>
                    <p className="text-xs text-slate-500 mt-1">Tip: use keyboard ← / → to move between filtered mistakes.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSelectPrevious}
                      disabled={selectedMistakeIndex <= 0}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-500 px-1">
                      {selectedMistakeIndex + 1}/{filtered.length}
                    </span>
                    <button
                      onClick={handleSelectNext}
                      disabled={selectedMistakeIndex < 0 || selectedMistakeIndex >= filtered.length - 1}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <input
                      value={mistakeJumpInput}
                      onChange={(event) => setMistakeJumpInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleJumpToMistakePosition()
                        }
                      }}
                      placeholder="#"
                      className="warm-focus-input w-14 px-2 py-2 border border-slate-300 rounded-lg bg-white text-sm text-center"
                    />
                    <button
                      onClick={handleJumpToMistakePosition}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-sm"
                    >
                      Go
                    </button>
                    <Link
                      href={`/exam/${selectedMistake.year}?paper=${selectedMistake.paper}&q=${selectedMistake.index + 1}`}
                      className="warm-primary-btn px-3 py-2 rounded-lg text-sm"
                    >
                      Open in Exam
                    </Link>
                  </div>
                </div>

                {loadingYear === selectedMistake.year ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Loading question details...
                  </div>
                ) : detailError ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {detailError}
                  </div>
                ) : !selectedQuestion ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Question content is unavailable for this item.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">Question</h3>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed">
                        <LatexRenderer latex={selectedQuestion.stemLatex} />
                        {selectedQuestion.stemImage && !stemImageFailed && (
                          <img
                            src={selectedQuestion.stemImage}
                            alt="Question stem"
                            className="mt-3 max-w-full h-auto rounded-lg border border-slate-200 bg-white"
                            onError={() => setStemImageFailed(true)}
                          />
                        )}
                        {selectedQuestion.stemImage && stemImageFailed && (
                          <p className="mt-2 text-xs text-amber-700">Question image failed to load on this device.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">Options</h3>
                      <div className="space-y-2">
                        {selectedQuestion.options.map((option) => {
                          const isCorrect = option.key === selectedQuestion.answerKey
                          return (
                            <div
                              key={option.key}
                              className={`rounded-lg border p-3 text-sm ${
                                isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-semibold">{option.key}.</span>
                                <div className="flex-1">
                                  <LatexRenderer latex={option.latex} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">Explanation</h3>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed">
                        <LatexRenderer latex={selectedQuestion.explanationLatex} />
                        {selectedQuestion.explanationImage && !explanationImageFailed && (
                          <img
                            src={selectedQuestion.explanationImage}
                            alt="Question explanation"
                            className="mt-3 max-w-full h-auto rounded-lg border border-blue-200 bg-white"
                            onError={() => setExplanationImageFailed(true)}
                          />
                        )}
                        {selectedQuestion.explanationImage && explanationImageFailed && (
                          <p className="mt-2 text-xs text-amber-700">Explanation image failed to load on this device.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
      {infoMessage && (
        <div className="fixed right-5 top-5 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
          {infoMessage}
        </div>
      )}
    </div>
  )
}
