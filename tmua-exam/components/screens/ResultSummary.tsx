'use client'

import { useMemo, useState } from 'react'
import { Question } from '@/lib/types'
import { GRADE_MAPPINGS } from '@/lib/utils'

interface QuestionOutcome {
  question: Question
  userAnswer?: string
  correctAnswer: string
  isCorrect: boolean
}

interface ResultSummaryProps {
  year?: string
  scoreP1: number
  scoreP2: number
  totalScore: number
  grade: number
  questionOutcomes: QuestionOutcome[]
  onReviewQuestion: (questionId: string) => void
  onAddToMistakes: (questionId: string) => void
  onAddAllIncorrectToMistakes?: () => void
  onAddFilteredIncorrectToMistakes?: (questionIds: string[]) => void
  onRetake?: () => void
}

function toCsvCell(value: unknown): string {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export default function ResultSummary({
  year,
  scoreP1,
  scoreP2,
  totalScore,
  grade,
  questionOutcomes,
  onReviewQuestion,
  onAddToMistakes,
  onAddAllIncorrectToMistakes,
  onAddFilteredIncorrectToMistakes,
  onRetake,
}: ResultSummaryProps) {
  const wrongCount = questionOutcomes.filter((o) => !o.isCorrect && Boolean(o.userAnswer)).length
  const unansweredCount = questionOutcomes.filter((o) => !o.userAnswer).length
  const correctCount = questionOutcomes.filter((o) => o.isCorrect).length
  const accuracy = Math.round((totalScore / 40) * 100)
  const p1Total = questionOutcomes.filter((o) => o.question.paper === 1).length
  const p2Total = questionOutcomes.filter((o) => o.question.paper === 2).length
  const p1Correct = questionOutcomes.filter((o) => o.question.paper === 1 && o.isCorrect).length
  const p2Correct = questionOutcomes.filter((o) => o.question.paper === 2 && o.isCorrect).length
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unanswered' | 'correct'>('all')
  const [query, setQuery] = useState('')

  const baseFilteredOutcomes = useMemo(() => {
    if (filter === 'incorrect') return questionOutcomes.filter((o) => !o.isCorrect && Boolean(o.userAnswer))
    if (filter === 'unanswered') return questionOutcomes.filter((o) => !o.userAnswer)
    if (filter === 'correct') return questionOutcomes.filter((o) => o.isCorrect)
    return questionOutcomes
  }, [filter, questionOutcomes])

  const filteredOutcomes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return baseFilteredOutcomes
    return baseFilteredOutcomes.filter((outcome) => {
      const statusText = outcome.isCorrect ? 'correct' : outcome.userAnswer ? 'incorrect' : 'unanswered'
      const searchable = `${outcome.question.id} p${outcome.question.paper} q${outcome.question.index + 1} ${
        outcome.userAnswer || ''
      } ${outcome.correctAnswer} ${statusText}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [baseFilteredOutcomes, query])

  const filteredIncorrectIds = useMemo(() => {
    return filteredOutcomes
      .filter((outcome) => !outcome.isCorrect && Boolean(outcome.userAnswer))
      .map((outcome) => outcome.question.id)
  }, [filteredOutcomes])

  const handleExportResultCsv = () => {
    if (filteredOutcomes.length === 0) return

    const rows = [
      ['Year', 'Paper', 'Question', 'Question ID', 'Status', 'Your Answer', 'Correct Answer', 'Filter'],
      ...filteredOutcomes.map((outcome) => [
        year || '',
        outcome.question.paper,
        outcome.question.index + 1,
        outcome.question.id,
        outcome.isCorrect ? 'Correct' : outcome.userAnswer ? 'Incorrect' : 'Unanswered',
        outcome.userAnswer || '',
        outcome.correctAnswer,
        filter,
      ]),
    ]

    const csv = `\uFEFF${rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-result-${year || 'tmua'}-${filter}-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 py-10 space-y-6">
      <section className="brand-card rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">Exam Results</h1>
        <p className="mt-2 text-slate-600">
          Automatic marking complete{year ? ` for ${year}` : ''}. Review each question and add difficult ones to your mistake book.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="brand-card-muted rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-tmua-blue">{scoreP1}</div>
            <div className="text-sm text-slate-600 mt-1">Paper 1 / 20</div>
          </div>
          <div className="brand-card-muted rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-tmua-blue">{scoreP2}</div>
            <div className="text-sm text-slate-600 mt-1">Paper 2 / 20</div>
          </div>
          <div className="brand-card-muted rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-emerald-700">{totalScore}</div>
            <div className="text-sm text-slate-600 mt-1">Total / 40</div>
          </div>
          <div className="brand-card-muted rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-emerald-700">{accuracy}%</div>
            <div className="text-sm text-slate-600 mt-1">Accuracy</div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">TMUA Grade: {grade.toFixed(1)}</h3>
          <div className="relative h-12 bg-slate-200 rounded-full overflow-hidden">
            {GRADE_MAPPINGS.map((mapping, idx) => {
              const width =
                idx < GRADE_MAPPINGS.length - 1
                  ? ((GRADE_MAPPINGS[idx + 1].score - mapping.score) / 40) * 100
                  : ((40 - mapping.score) / 40) * 100

              const isUserGrade = grade === mapping.grade

              return (
                <div
                  key={mapping.grade}
                  className={`absolute h-full flex items-center justify-center text-xs font-semibold ${
                    isUserGrade ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                  style={{
                    left: `${(mapping.score / 40) * 100}%`,
                    width: `${width}%`,
                  }}
                >
                  {mapping.grade.toFixed(1)}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Score: 0</span>
            <span>40</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Paper 1 Accuracy</div>
            <div className="text-xl font-black text-tmua-blue">{Math.round((p1Correct / Math.max(p1Total, 1)) * 100)}%</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Paper 2 Accuracy</div>
            <div className="text-xl font-black text-tmua-blue">{Math.round((p2Correct / Math.max(p2Total, 1)) * 100)}%</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Unanswered</div>
            <div className="text-xl font-black text-amber-700">{unansweredCount}</div>
          </div>
        </div>
      </section>

      <section className="brand-card rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-black text-slate-900">Question Breakdown</h2>
        <p className="text-slate-600 mt-1">
          {wrongCount} incorrect question{wrongCount === 1 ? '' : 's'} · Showing {filteredOutcomes.length} /{' '}
          {questionOutcomes.length}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            All ({questionOutcomes.length})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === 'incorrect' ? 'bg-red-700 text-white border-red-700' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            Incorrect ({wrongCount})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === 'unanswered' ? 'bg-amber-700 text-white border-amber-700' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            Unanswered ({unansweredCount})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === 'correct'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            Correct ({correctCount})
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search paper, question, ID, answer..."
            className="px-3 py-1.5 rounded-full text-sm border border-slate-300 bg-white min-w-[230px]"
          />
          <button
            onClick={() => setQuery('')}
            className="px-3 py-1.5 rounded-full text-sm border bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Reset Search
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {onAddAllIncorrectToMistakes && (
              <button
                onClick={onAddAllIncorrectToMistakes}
                className="px-3 py-1.5 rounded-full text-sm border bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Add All Incorrect to Mistakes
              </button>
            )}
            {onAddFilteredIncorrectToMistakes && (
              <button
                onClick={() => onAddFilteredIncorrectToMistakes(filteredIncorrectIds)}
                disabled={filteredIncorrectIds.length === 0}
                className="px-3 py-1.5 rounded-full text-sm border bg-white border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Filtered Incorrect
              </button>
            )}
            <button
              onClick={handleExportResultCsv}
              disabled={filteredOutcomes.length === 0}
              className="px-3 py-1.5 rounded-full text-sm border bg-white border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Result CSV
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredOutcomes.map((outcome) => {
            const isUnanswered = !outcome.userAnswer
            const statusClass = outcome.isCorrect
              ? 'border-emerald-300 bg-emerald-50/60'
              : isUnanswered
                ? 'border-amber-300 bg-amber-50/70'
                : 'border-red-300 bg-red-50/70'
            const statusLabel = outcome.isCorrect ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect'
            const statusTextClass = outcome.isCorrect
              ? 'text-emerald-700 font-semibold'
              : isUnanswered
                ? 'text-amber-700 font-semibold'
                : 'text-red-700 font-semibold'

            return (
              <div key={outcome.question.id} className={`border rounded-xl p-4 ${statusClass}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      Paper {outcome.question.paper}, Question {outcome.question.index + 1}
                    </div>
                    <div className="text-sm text-slate-700">
                      Status:{' '}
                      <span className={statusTextClass}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      Your answer: <span className="font-semibold">{outcome.userAnswer || 'No answer'}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      Correct answer: <span className="font-semibold text-emerald-700">{outcome.correctAnswer}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onReviewQuestion(outcome.question.id)}
                      className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-semibold"
                    >
                      Review Question
                    </button>
                    <button
                      onClick={() => onAddToMistakes(outcome.question.id)}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white text-sm"
                    >
                      Add to Mistakes
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredOutcomes.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No questions match this filter.
            </div>
          )}
        </div>
      </section>

      {onRetake && (
        <div className="flex justify-center">
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-tmua-blue text-white rounded-lg hover:bg-blue-900 font-semibold"
          >
            Start New Attempt
          </button>
        </div>
      )}
    </div>
  )
}
