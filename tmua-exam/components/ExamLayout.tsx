'use client'

import React from 'react'
import { formatTime } from '@/lib/utils'
import { ExamState, ColorScheme } from '@/lib/types'

interface ExamLayoutProps {
  children: React.ReactNode
  state: ExamState
  colorScheme: ColorScheme
  timeLeft?: number
  currentQuestion?: number
  totalQuestions?: number
  onEndExam: () => void
  onPrevious?: () => void
  onNext?: () => void
  onColorSchemeChange: (scheme: ColorScheme) => void
  currentFlag?: boolean
  onToggleFlag?: () => void
  onNextUnanswered?: () => void
  onNextFlagged?: () => void
  autoAdvanceEnabled?: boolean
  onAutoAdvanceChange?: (enabled: boolean) => void
  onJumpToQuestion?: (index: number) => void
  onShowNavigator?: () => void
}

interface SchemeTheme {
  pageBg: string
  text: string
  headerBg: string
  headerText: string
  subHeaderBg: string
  bordered: boolean
}

const SCHEMES: Record<ColorScheme, SchemeTheme> = {
  light: {
    pageBg: '#ffffff',
    text: '#000000',
    headerBg: '#016daa',
    headerText: '#ffffff',
    subHeaderBg: '#5d99d9',
    bordered: false,
  },
  'high-contrast': {
    pageBg: '#000000',
    text: '#ffffff',
    headerBg: '#000000',
    headerText: '#ffffff',
    subHeaderBg: '#1f2937',
    bordered: true,
  },
  'black-on-light-yellow': {
    pageBg: '#ffff80',
    text: '#000000',
    headerBg: '#ffff80',
    headerText: '#000000',
    subHeaderBg: '#ffff80',
    bordered: true,
  },
  'black-on-salmon': {
    pageBg: '#fdd3c5',
    text: '#000000',
    headerBg: '#fdd3c5',
    headerText: '#000000',
    subHeaderBg: '#fdd3c5',
    bordered: true,
  },
  'black-on-white': {
    pageBg: '#ffffff',
    text: '#000000',
    headerBg: '#ffffff',
    headerText: '#000000',
    subHeaderBg: '#ffffff',
    bordered: true,
  },
  'black-on-yellow': {
    pageBg: '#ffff00',
    text: '#000000',
    headerBg: '#ffff00',
    headerText: '#000000',
    subHeaderBg: '#ffff00',
    bordered: true,
  },
}

const SCHEME_LABELS: Array<{ value: ColorScheme; label: string }> = [
  { value: 'light', label: 'Color Scheme' },
  { value: 'black-on-light-yellow', label: 'Black on Light Yellow' },
  { value: 'black-on-salmon', label: 'Black on Salmon' },
  { value: 'black-on-white', label: 'Black on White' },
  { value: 'black-on-yellow', label: 'Black on Yellow' },
]

export default function ExamLayout({
  children,
  state,
  colorScheme,
  timeLeft,
  currentQuestion,
  totalQuestions,
  onEndExam,
  onPrevious,
  onNext,
  onColorSchemeChange,
  currentFlag,
  onToggleFlag,
  onNextUnanswered,
  onNextFlagged,
  autoAdvanceEnabled,
  onAutoAdvanceChange,
  onJumpToQuestion,
  onShowNavigator,
}: ExamLayoutProps) {
  const showTimer = ['READING_COUNTDOWN', 'PAPER1_ACTIVE', 'PAPER2_ACTIVE', 'PAPER2_INSTRUCTIONS'].includes(state)
  const showQuestionNav = ['PAPER1_ACTIVE', 'PAPER2_ACTIVE'].includes(state)
  const showFlagControl = showQuestionNav && Boolean(onToggleFlag)
  const showAutoAdvance = showQuestionNav && Boolean(onAutoAdvanceChange)
  const showJumpControl = showQuestionNav && Boolean(onJumpToQuestion) && Number.isFinite(totalQuestions)
  const showNavButtons = !['RESULT_SUMMARY', 'REVIEW_QUESTION'].includes(state)
  const [jumpValue, setJumpValue] = React.useState('')

  const theme = SCHEMES[colorScheme] ?? SCHEMES.light
  const edgeBorder = theme.bordered ? `2px solid ${theme.text}` : undefined
  const controlBorder = `1px solid ${theme.bordered ? theme.text : 'rgba(255,255,255,0.28)'}`
  const nextLabel =
    state === 'PAPER1_ACTIVE' && currentQuestion === totalQuestions
      ? 'Proceed to Paper 2'
      : state === 'PAPER2_ACTIVE' && currentQuestion === totalQuestions
        ? 'Complete the TMUA'
        : 'Next →'

  const handleJumpSubmit = () => {
    if (!showJumpControl || !onJumpToQuestion || !totalQuestions) return
    const parsed = Number.parseInt(jumpValue.trim(), 10)
    if (!Number.isFinite(parsed)) return
    const bounded = Math.max(1, Math.min(totalQuestions, parsed))
    onJumpToQuestion(bounded - 1)
    setJumpValue('')
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ backgroundColor: theme.pageBg, color: theme.text }}>
      <header
        className="px-5 py-1.5 flex justify-between items-center flex-shrink-0"
        style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: edgeBorder }}
      >
        <div className="text-[22px] leading-tight font-semibold">Test of Mathematics for University Admission</div>

        {(showTimer || showQuestionNav) && (
          <div className="text-right">
            {showTimer && timeLeft !== undefined && (
              <div className="text-lg font-medium">Time Left: {formatTime(timeLeft)}</div>
            )}
            {showQuestionNav && currentQuestion !== undefined && totalQuestions !== undefined && (
              <div className="text-lg">{currentQuestion} of {totalQuestions}</div>
            )}
          </div>
        )}
      </header>

      <div
        className="px-5 py-1.5 min-h-[42px] flex items-center justify-between gap-4 flex-shrink-0"
        style={{ backgroundColor: theme.subHeaderBg, borderLeft: edgeBorder, borderRight: edgeBorder }}
      >
        <div className="flex items-center gap-2">
          {showFlagControl && (
            <button
              onClick={onToggleFlag}
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: theme.headerText }}
            >
              <span aria-hidden>{currentFlag ? '⚑' : '⚐'}</span>
              <span>Flag for Review</span>
            </button>
          )}
          {showQuestionNav && onNextUnanswered && (
            <button
              onClick={onNextUnanswered}
              className="inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1 hover:opacity-90 transition-opacity"
              style={{ color: theme.headerText, border: controlBorder }}
            >
              Next Unanswered
            </button>
          )}
          {showQuestionNav && onNextFlagged && (
            <button
              onClick={onNextFlagged}
              className="inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1 hover:opacity-90 transition-opacity"
              style={{ color: theme.headerText, border: controlBorder }}
            >
              Next Flagged
            </button>
          )}
          {showAutoAdvance && (
            <label className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.headerText }}>
              <input
                type="checkbox"
                checked={Boolean(autoAdvanceEnabled)}
                onChange={(event) => onAutoAdvanceChange?.(event.target.checked)}
                className="h-4 w-4"
              />
              <span>Auto-advance</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showJumpControl && (
            <>
              <input
                type="text"
                value={jumpValue}
                onChange={(event) => setJumpValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleJumpSubmit()
                  }
                }}
                placeholder="Q#"
                inputMode="numeric"
                className="h-9 w-24 px-3 rounded-md text-sm"
                style={{
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                }}
              />
              <button
                type="button"
                onClick={handleJumpSubmit}
                className="h-9 rounded-md px-4 text-sm font-medium"
                style={{ color: theme.headerText, border: controlBorder }}
              >
                Go
              </button>
            </>
          )}

          <select
            value={colorScheme}
            onChange={(event) => onColorSchemeChange(event.target.value as ColorScheme)}
            className="h-9 min-w-[210px] px-3 rounded-md text-sm"
            style={{
              color: '#000000',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
            }}
          >
            {SCHEME_LABELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">{children}</main>

      {showNavButtons && (
        <footer
          className="px-5 py-2 flex justify-between items-center gap-3 flex-shrink-0"
          style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: edgeBorder }}
        >
          <button
            onClick={onEndExam}
            className="rounded-md px-5 py-2 text-base font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: controlBorder }}
          >
            End Exam
          </button>

          <div className="flex items-center gap-2">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="rounded-md px-5 py-2 text-base font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: controlBorder }}
              >
                ← Previous
              </button>
            )}

            {onShowNavigator && showQuestionNav && (
              <button
                onClick={onShowNavigator}
                className="rounded-md px-5 py-2 text-base font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: controlBorder }}
              >
                Navigator
              </button>
            )}

            {onNext && (
              <button
                onClick={onNext}
                className="rounded-md px-5 py-2 text-base font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.headerBg, color: theme.headerText, border: controlBorder }}
              >
                {nextLabel}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
