'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ColorScheme, ExamSession, INITIAL_SESSION, Question } from '@/lib/types'
import ExamLayout from '@/components/ExamLayout'
import WelcomeScreen from '@/components/screens/WelcomeScreen'
import ReadingCountdown from '@/components/screens/ReadingCountdown'
import PaperScreen from '@/components/screens/PaperScreen'
import BreakScreen from '@/components/screens/BreakScreen'
import SubmitConfirm from '@/components/screens/SubmitConfirm'
import ResultSummary from '@/components/screens/ResultSummary'
import ReviewQuestion from '@/components/screens/ReviewQuestion'
import NavigatorModal from '@/components/NavigatorModal'
import { addExamAttempt, addMistake, getCurrentUserEmail } from '@/lib/storage'
import { evaluateExam } from '@/lib/exam-scoring'

const SESSION_KEY = 'tmua_exam_session'
const AUTO_ADVANCE_KEY = 'tmua_auto_advance'

interface ExamRunnerProps {
  year: string
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

function getCurrentPaperSessionKey(year: string): string {
  return `${SESSION_KEY}_${year}`
}

export default function ExamRunner({ year }: ExamRunnerProps) {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<ExamSession>(INITIAL_SESSION)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [savedSessionCandidate, setSavedSessionCandidate] = useState<ExamSession | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showNavigatorModal, setShowNavigatorModal] = useState(false)
  const [showPaper2ConfirmModal, setShowPaper2ConfirmModal] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const targetPaperParam = searchParams.get('paper')
  const targetQuestionParam = searchParams.get('q')

  const getDeepLinkTarget = useCallback(() => {
    const paper = Number.parseInt(targetPaperParam || '', 10)
    const question = Number.parseInt(targetQuestionParam || '', 10)
    if (![1, 2].includes(paper)) return null
    if (!Number.isFinite(question) || question < 1 || question > 20) return null
    return { paper: paper as 1 | 2, index: question - 1 }
  }, [targetPaperParam, targetQuestionParam])

  const buildSessionFromDeepLink = useCallback((paper: 1 | 2, index: number): ExamSession => {
    return {
      ...INITIAL_SESSION,
      state: paper === 1 ? 'PAPER1_ACTIVE' : 'PAPER2_ACTIVE',
      currentPaper: paper,
      currentQuestionIndex: index,
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true)
    setQuestionsError(null)
    try {
      const res = await fetch(`/api/questions?year=${year}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = (await res.json()) as Question[]
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No questions found for year ${year}`)
      }
      const normalized = [...data].sort((a, b) => {
        if (a.paper !== b.paper) return a.paper - b.paper
        return a.index - b.index
      })
      const paper1Count = normalized.filter((q) => q.paper === 1).length
      const paper2Count = normalized.filter((q) => q.paper === 2).length
      if (paper1Count < 20 || paper2Count < 20) {
        throw new Error(`Incomplete question set: Paper1=${paper1Count}, Paper2=${paper2Count}`)
      }
      setQuestions(normalized)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setQuestionsError(message)
      setQuestions([])
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [year])

  const repairSession = useCallback((raw: ExamSession): ExamSession => {
    const next = { ...raw }
    if (!Number.isFinite(next.paper2InstructionsTimeLeft) || next.paper2InstructionsTimeLeft < 0) next.paper2InstructionsTimeLeft = 60
    if (!Number.isFinite(next.readingTimeLeft) || next.readingTimeLeft < 0) next.readingTimeLeft = 60
    if (!Number.isFinite(next.paper1TimeLeft) || next.paper1TimeLeft < 0) next.paper1TimeLeft = 75 * 60
    if (!Number.isFinite(next.paper2TimeLeft) || next.paper2TimeLeft < 0) next.paper2TimeLeft = 75 * 60
    return next
  }, [])

  useEffect(() => {
    const deepLink = getDeepLinkTarget()
    const sessionKey = getCurrentPaperSessionKey(year)
    const savedAutoAdvance = localStorage.getItem(AUTO_ADVANCE_KEY)
    if (savedAutoAdvance === '1') {
      setAutoAdvance(true)
    }

    const saved = localStorage.getItem(sessionKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExamSession
        const loadedSession = repairSession(parsed)
        const hasStarted =
          loadedSession.state !== 'WELCOME' ||
          Object.keys(loadedSession.paper1Answers).length > 0 ||
          Object.keys(loadedSession.paper2Answers).length > 0

        if (hasStarted) {
          if (deepLink) {
            setSession(buildSessionFromDeepLink(deepLink.paper, deepLink.index))
          } else {
            setSavedSessionCandidate(loadedSession)
            setShowResumeModal(true)
          }
        } else {
          if (deepLink) {
            setSession(buildSessionFromDeepLink(deepLink.paper, deepLink.index))
          } else {
            setSession(loadedSession)
          }
        }
      } catch (e) {
        console.error('Failed to load session', e)
      }
    } else if (deepLink) {
      setSession(buildSessionFromDeepLink(deepLink.paper, deepLink.index))
    }

    setIsHydrated(true)
    void loadQuestions()
  }, [year, loadQuestions, repairSession, getDeepLinkTarget, buildSessionFromDeepLink])

  useEffect(() => {
    if (!isHydrated) return
    const sessionKey = getCurrentPaperSessionKey(year)
    localStorage.setItem(sessionKey, JSON.stringify(session))
  }, [session, year, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(AUTO_ADVANCE_KEY, autoAdvance ? '1' : '0')
  }, [autoAdvance, isHydrated])

  const handleResetProgress = useCallback(() => {
    const sessionKey = getCurrentPaperSessionKey(year)
    localStorage.removeItem(sessionKey)
    const deepLink = getDeepLinkTarget()
    if (deepLink) {
      setSession({
        ...INITIAL_SESSION,
        state: deepLink.paper === 1 ? 'PAPER1_ACTIVE' : 'PAPER2_ACTIVE',
        currentPaper: deepLink.paper,
        currentQuestionIndex: deepLink.index,
      })
    } else {
      setSession(INITIAL_SESSION)
    }
    setShowEndModal(false)
    setShowNavigatorModal(false)
    setShowPaper2ConfirmModal(false)
    setSavedSessionCandidate(null)
    setShowResumeModal(false)
  }, [year, getDeepLinkTarget])

  const handleResumeSavedAttempt = useCallback(() => {
    if (savedSessionCandidate) {
      setSession(savedSessionCandidate)
    }
    setShowResumeModal(false)
  }, [savedSessionCandidate])

  useEffect(() => {
    if (!isHydrated || showResumeModal) return
    const deepLink = getDeepLinkTarget()
    if (!deepLink) return
    setSession((prev) => {
      if (prev.state !== 'WELCOME') return prev
      return {
        ...prev,
        state: deepLink.paper === 1 ? 'PAPER1_ACTIVE' : 'PAPER2_ACTIVE',
        currentPaper: deepLink.paper,
        currentQuestionIndex: deepLink.index,
      }
    })
  }, [isHydrated, showResumeModal, getDeepLinkTarget])

  const getResumeMeta = useCallback((candidate: ExamSession | null) => {
    if (!candidate) return null
    const answeredP1 = Object.keys(candidate.paper1Answers).length
    const answeredP2 = Object.keys(candidate.paper2Answers).length
    const totalAnswered = answeredP1 + answeredP2
    return {
      answeredP1,
      answeredP2,
      totalAnswered,
      state: candidate.state,
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (session.state === 'READING_COUNTDOWN' && session.readingTimeLeft > 0) {
      interval = setInterval(() => {
        setSession((prev) => {
          const newTime = prev.readingTimeLeft - 1
          if (newTime <= 0) {
            return { ...prev, state: 'PAPER1_ACTIVE', readingTimeLeft: 0 }
          }
          return { ...prev, readingTimeLeft: newTime }
        })
      }, 1000)
    } else if (session.state === 'PAPER1_ACTIVE' && session.paper1TimeLeft > 0) {
      interval = setInterval(() => {
        setSession((prev) => {
          const newTime = prev.paper1TimeLeft - 1
          if (newTime <= 0) {
            return { ...prev, state: 'PAPER2_INSTRUCTIONS', paper1TimeLeft: 0, paper2InstructionsTimeLeft: 60 }
          }
          return { ...prev, paper1TimeLeft: newTime }
        })
      }, 1000)
    } else if (session.state === 'PAPER2_INSTRUCTIONS' && session.paper2InstructionsTimeLeft > 0) {
      interval = setInterval(() => {
        setSession((prev) => {
          const newTime = prev.paper2InstructionsTimeLeft - 1
          if (newTime <= 0) {
            return {
              ...prev,
              state: 'PAPER2_ACTIVE',
              currentPaper: 2,
              currentQuestionIndex: 0,
              paper2InstructionsTimeLeft: 0,
            }
          }
          return { ...prev, paper2InstructionsTimeLeft: newTime }
        })
      }, 1000)
    } else if (session.state === 'PAPER2_ACTIVE' && session.paper2TimeLeft > 0) {
      interval = setInterval(() => {
        setSession((prev) => {
          const newTime = prev.paper2TimeLeft - 1
          if (newTime <= 0) {
            return { ...prev, state: 'SUBMIT_CONFIRM', paper2TimeLeft: 0 }
          }
          return { ...prev, paper2TimeLeft: newTime }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [session.state, session.readingTimeLeft, session.paper1TimeLeft, session.paper2InstructionsTimeLeft, session.paper2TimeLeft])

  const handleSubmit = useCallback(() => {
    const { scoreP1, scoreP2, totalScore, grade, questionOutcomes } = evaluateExam(
      questions,
      session.paper1Answers,
      session.paper2Answers,
    )
    const compactOutcomes = questionOutcomes.map((outcome) => ({
      questionId: outcome.question.id,
      paper: outcome.question.paper,
      index: outcome.question.index,
      userAnswer: outcome.userAnswer,
      correctAnswer: outcome.correctAnswer,
      isCorrect: outcome.isCorrect,
    }))
    const email = getCurrentUserEmail()
    if (email) {
      addExamAttempt(email, {
        year,
        scoreP1,
        scoreP2,
        totalScore,
        grade,
        questionOutcomes: compactOutcomes,
      })
    }

    setSession((prev) => ({
      ...prev,
      state: 'RESULT_SUMMARY',
      scoreP1,
      scoreP2,
      totalScore,
      grade,
      questionOutcomes,
    }))
  }, [questions, session.paper1Answers, session.paper2Answers, year])

  const handleNext = useCallback(() => {
    if (session.state === 'PAPER1_ACTIVE' && session.currentQuestionIndex === 19) {
      setShowPaper2ConfirmModal(true)
      return
    }

    if (session.state === 'PAPER2_ACTIVE' && session.currentQuestionIndex === 19) {
      setShowPaper2ConfirmModal(true)
      return
    }

    setSession((prev) => {
      if (prev.state === 'WELCOME') {
        return { ...prev, state: 'READING_COUNTDOWN' }
      }
      if (prev.state === 'READING_COUNTDOWN') {
        return { ...prev, state: 'PAPER1_ACTIVE' }
      }
      if (prev.state === 'PAPER1_ACTIVE' && prev.currentQuestionIndex < 19) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }
      }
      if (prev.state === 'PAPER2_ACTIVE' && prev.currentQuestionIndex < 19) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }
      }
      return prev
    })
  }, [session.state, session.currentQuestionIndex])

  const handlePrevious = useCallback(() => {
    setSession((prev) => {
      if ((prev.state === 'PAPER1_ACTIVE' || prev.state === 'PAPER2_ACTIVE') && prev.currentQuestionIndex > 0) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }
      }
      return prev
    })
  }, [])

  const handleStagePrevious = useCallback(() => {
    setSession((prev) => {
      if (prev.state === 'READING_COUNTDOWN') {
        return { ...prev, state: 'WELCOME' }
      }
      if (prev.state === 'PAPER2_INSTRUCTIONS') {
        return {
          ...prev,
          state: 'PAPER1_ACTIVE',
          currentPaper: 1,
          currentQuestionIndex: 19,
        }
      }
      if (prev.state === 'SUBMIT_CONFIRM') {
        return {
          ...prev,
          state: 'PAPER2_ACTIVE',
          currentPaper: 2,
          currentQuestionIndex: 19,
        }
      }
      return prev
    })
  }, [])

  const handleConfirmPaper2 = useCallback(() => {
    setShowPaper2ConfirmModal(false)
    if (session.state === 'PAPER1_ACTIVE') {
      setSession((prev) => ({ ...prev, state: 'PAPER2_INSTRUCTIONS', paper2InstructionsTimeLeft: 60 }))
    } else if (session.state === 'PAPER2_ACTIVE') {
      handleSubmit()
    }
  }, [session.state, handleSubmit])

  const handleEndExam = useCallback(() => {
    setShowEndModal(true)
  }, [])

  const handleConfirmEnd = useCallback(() => {
    setShowEndModal(false)
    handleSubmit()
  }, [handleSubmit])

  const handleAnswerSelect = useCallback(
    (questionIndex: number, answer: string) => {
      setSession((prev) => {
        const canAutoAdvance =
          autoAdvance &&
          (prev.state === 'PAPER1_ACTIVE' || prev.state === 'PAPER2_ACTIVE') &&
          questionIndex === prev.currentQuestionIndex &&
          prev.currentQuestionIndex < 19

        if (prev.currentPaper === 1) {
          return {
            ...prev,
            paper1Answers: { ...prev.paper1Answers, [questionIndex]: answer },
            currentQuestionIndex: canAutoAdvance ? prev.currentQuestionIndex + 1 : prev.currentQuestionIndex,
          }
        }

        return {
          ...prev,
          paper2Answers: { ...prev.paper2Answers, [questionIndex]: answer },
          currentQuestionIndex: canAutoAdvance ? prev.currentQuestionIndex + 1 : prev.currentQuestionIndex,
        }
      })
    },
    [autoAdvance],
  )

  const handleToggleFlag = useCallback(() => {
    setSession((prev) => {
      const idx = prev.currentQuestionIndex
      if (prev.currentPaper === 1) {
        return {
          ...prev,
          paper1Flags: { ...prev.paper1Flags, [idx]: !prev.paper1Flags[idx] },
        }
      }
      return {
        ...prev,
        paper2Flags: { ...prev.paper2Flags, [idx]: !prev.paper2Flags[idx] },
      }
    })
  }, [])

  const handleColorSchemeChange = useCallback((scheme: ColorScheme) => {
    setSession((prev) => ({ ...prev, colorScheme: scheme }))
  }, [])

  const handleJumpToQuestion = useCallback((index: number) => {
    setSession((prev) => ({ ...prev, currentQuestionIndex: index }))
  }, [])

  const handleNextUnanswered = useCallback(() => {
    setSession((prev) => {
      if (prev.state !== 'PAPER1_ACTIVE' && prev.state !== 'PAPER2_ACTIVE') return prev
      const answers = prev.currentPaper === 1 ? prev.paper1Answers : prev.paper2Answers
      const total = 20

      for (let step = 1; step <= total; step += 1) {
        const idx = (prev.currentQuestionIndex + step) % total
        if (!answers[idx]) {
          return { ...prev, currentQuestionIndex: idx }
        }
      }

      setFeedback({ tone: 'success', message: 'All questions are answered.' })
      return prev
    })
  }, [])

  const handleNextFlagged = useCallback(() => {
    setSession((prev) => {
      if (prev.state !== 'PAPER1_ACTIVE' && prev.state !== 'PAPER2_ACTIVE') return prev
      const flags = prev.currentPaper === 1 ? prev.paper1Flags : prev.paper2Flags
      const total = 20

      for (let step = 1; step <= total; step += 1) {
        const idx = (prev.currentQuestionIndex + step) % total
        if (flags[idx]) {
          return { ...prev, currentQuestionIndex: idx }
        }
      }

      setFeedback({ tone: 'error', message: 'No flagged question found on this paper.' })
      return prev
    })
  }, [])

  const handleReviewQuestion = useCallback((questionId: string) => {
    setSession((prev) => ({ ...prev, state: 'REVIEW_QUESTION', reviewingQuestionId: questionId }))
  }, [])

  const handleBackToResults = useCallback(() => {
    setSession((prev) => ({ ...prev, state: 'RESULT_SUMMARY' }))
  }, [])

  const handleAddToMistakes = useCallback(
    (questionId: string) => {
      const email = getCurrentUserEmail()
      if (!email) {
        setFeedback({ tone: 'error', message: 'Please sign in on the home page to use the mistake book.' })
        return
      }

      const question = questions.find((q) => q.id === questionId)
      if (!question) return
      const added = addMistake(email, question)
      setFeedback({
        tone: added ? 'success' : 'error',
        message: added ? 'Added to your mistake book.' : 'This question is already in your mistake book.',
      })
    },
    [questions],
  )

  const handleAddAllIncorrectToMistakes = useCallback(() => {
    const email = getCurrentUserEmail()
    if (!email) {
      setFeedback({ tone: 'error', message: 'Please sign in on the home page to use the mistake book.' })
      return
    }

    const outcomes = session.questionOutcomes || []
    const incorrect = outcomes.filter((outcome) => !outcome.isCorrect && Boolean(outcome.userAnswer))
    if (incorrect.length === 0) {
      setFeedback({ tone: 'success', message: 'No incorrect questions to add.' })
      return
    }

    let addedCount = 0
    let duplicateCount = 0
    for (const outcome of incorrect) {
      const added = addMistake(email, outcome.question)
      if (added) addedCount += 1
      else duplicateCount += 1
    }

    if (addedCount === 0) {
      setFeedback({ tone: 'success', message: 'All incorrect questions are already in your mistake book.' })
      return
    }

    setFeedback({
      tone: 'success',
      message:
        duplicateCount > 0
          ? `Added ${addedCount} incorrect question(s), skipped ${duplicateCount} duplicate(s).`
          : `Added ${addedCount} incorrect question(s) to your mistake book.`,
    })
  }, [session.questionOutcomes])

  const handleAddFilteredIncorrectToMistakes = useCallback(
    (questionIds: string[]) => {
      const email = getCurrentUserEmail()
      if (!email) {
        setFeedback({ tone: 'error', message: 'Please sign in on the home page to use the mistake book.' })
        return
      }

      const outcomes = session.questionOutcomes || []
      const outcomeById = new Map(outcomes.map((outcome) => [outcome.question.id, outcome]))
      const uniqueIds = Array.from(new Set(questionIds))

      if (uniqueIds.length === 0) {
        setFeedback({ tone: 'success', message: 'No filtered incorrect questions to add.' })
        return
      }

      let addedCount = 0
      let duplicateCount = 0
      let skippedCount = 0

      for (const id of uniqueIds) {
        const outcome = outcomeById.get(id)
        if (!outcome || outcome.isCorrect || !outcome.userAnswer) {
          skippedCount += 1
          continue
        }
        const added = addMistake(email, outcome.question)
        if (added) addedCount += 1
        else duplicateCount += 1
      }

      if (addedCount === 0 && duplicateCount === 0) {
        setFeedback({ tone: 'success', message: 'No filtered incorrect questions to add.' })
        return
      }

      if (addedCount === 0) {
        setFeedback({ tone: 'success', message: 'All filtered incorrect questions are already in your mistake book.' })
        return
      }

      const baseMessage =
        duplicateCount > 0
          ? `Added ${addedCount} filtered incorrect question(s), skipped ${duplicateCount} duplicate(s).`
          : `Added ${addedCount} filtered incorrect question(s) to your mistake book.`

      setFeedback({
        tone: 'success',
        message: skippedCount > 0 ? `${baseMessage} ${skippedCount} item(s) were not incorrect.` : baseMessage,
      })
    },
    [session.questionOutcomes],
  )

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const currentPaperQuestions = useMemo(
    () => questions.filter((q) => q.paper === session.currentPaper),
    [questions, session.currentPaper],
  )
  const currentQuestion = currentPaperQuestions[session.currentQuestionIndex]

  const getCurrentAnswer = () =>
    session.currentPaper === 1
      ? session.paper1Answers[session.currentQuestionIndex]
      : session.paper2Answers[session.currentQuestionIndex]

  const getCurrentFlag = () =>
    session.currentPaper === 1
      ? session.paper1Flags[session.currentQuestionIndex]
      : session.paper2Flags[session.currentQuestionIndex]

  const isExamActive =
    session.state === 'READING_COUNTDOWN' ||
    session.state === 'PAPER1_ACTIVE' ||
    session.state === 'PAPER2_INSTRUCTIONS' ||
    session.state === 'PAPER2_ACTIVE' ||
    session.state === 'SUBMIT_CONFIRM'

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isExamActive) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isExamActive])

  const handleShortcutAnswer = useCallback(
    (optionKey: string) => {
      if (!currentQuestion) return
      const exists = currentQuestion.options.some((o) => o.key.toUpperCase() === optionKey)
      if (!exists) return
      handleAnswerSelect(session.currentQuestionIndex, optionKey)
    },
    [currentQuestion, handleAnswerSelect, session.currentQuestionIndex],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (session.state !== 'PAPER1_ACTIVE' && session.state !== 'PAPER2_ACTIVE') return

      const key = event.key.toUpperCase()

      if (/^[A-H]$/.test(key)) {
        event.preventDefault()
        handleShortcutAnswer(key)
        return
      }

      if (key === 'N') {
        event.preventDefault()
        handleNext()
        return
      }

      if (key === 'P') {
        event.preventDefault()
        handlePrevious()
        return
      }

      if (key === 'F') {
        event.preventDefault()
        handleToggleFlag()
        return
      }

      if (key === 'J') {
        event.preventDefault()
        setShowNavigatorModal(true)
        return
      }

      if (key === 'U') {
        event.preventDefault()
        handleNextUnanswered()
        return
      }

      if (key === 'G') {
        event.preventDefault()
        handleNextFlagged()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [session.state, handleShortcutAnswer, handleNext, handlePrevious, handleToggleFlag, handleNextUnanswered, handleNextFlagged])

  let timeLeft: number | undefined
  if (session.state === 'READING_COUNTDOWN') timeLeft = session.readingTimeLeft
  else if (session.state === 'PAPER1_ACTIVE') timeLeft = session.paper1TimeLeft
  else if (session.state === 'PAPER2_ACTIVE') timeLeft = session.paper2TimeLeft
  else if (session.state === 'PAPER2_INSTRUCTIONS') {
    timeLeft =
      Number.isFinite(session.paper2InstructionsTimeLeft) && session.paper2InstructionsTimeLeft >= 0
        ? session.paper2InstructionsTimeLeft
        : 60
  }

  const renderScreen = () => {
    switch (session.state) {
      case 'WELCOME':
        return <WelcomeScreen onResetProgress={handleResetProgress} />
      case 'READING_COUNTDOWN':
        return <ReadingCountdown timeLeft={session.readingTimeLeft} />
      case 'PAPER1_ACTIVE':
      case 'PAPER2_ACTIVE':
        return (
          <PaperScreen
            question={currentQuestion}
            selectedAnswer={getCurrentAnswer()}
            onAnswerSelect={(answer) => handleAnswerSelect(session.currentQuestionIndex, answer)}
            currentIndex={session.currentQuestionIndex}
            colorScheme={session.colorScheme}
          />
        )
      case 'PAPER2_INSTRUCTIONS':
        return (
          <BreakScreen
            timeLeft={session.paper2InstructionsTimeLeft}
            onStartPaper2={() =>
              setSession((prev) => ({
                ...prev,
                state: 'PAPER2_ACTIVE',
                currentPaper: 2,
                currentQuestionIndex: 0,
              }))
            }
          />
        )
      case 'SUBMIT_CONFIRM':
        return (
          <SubmitConfirm
            paper1Answers={session.paper1Answers}
            paper2Answers={session.paper2Answers}
            paper1Flags={session.paper1Flags}
            paper2Flags={session.paper2Flags}
            onConfirm={handleSubmit}
            onCancel={() => setSession((prev) => ({ ...prev, state: 'PAPER2_ACTIVE' }))}
          />
        )
      case 'RESULT_SUMMARY':
        return (
          <ResultSummary
            year={year}
            scoreP1={session.scoreP1!}
            scoreP2={session.scoreP2!}
            totalScore={session.totalScore!}
            grade={session.grade!}
            questionOutcomes={session.questionOutcomes || []}
            onReviewQuestion={handleReviewQuestion}
            onAddToMistakes={handleAddToMistakes}
            onAddAllIncorrectToMistakes={handleAddAllIncorrectToMistakes}
            onAddFilteredIncorrectToMistakes={handleAddFilteredIncorrectToMistakes}
            onRetake={handleResetProgress}
          />
        )
      case 'REVIEW_QUESTION': {
        const reviewQuestion = questions.find((q) => q.id === session.reviewingQuestionId)
        const outcome = session.questionOutcomes?.find((w) => w.question.id === session.reviewingQuestionId)
        return reviewQuestion && outcome ? (
          <ReviewQuestion
            question={reviewQuestion}
            userAnswer={outcome.userAnswer}
            onBack={handleBackToResults}
            onAddToMistakes={handleAddToMistakes}
          />
        ) : null
      }
      default:
        return <div>Unknown state</div>
    }
  }

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading questions...</h2>
          <p className="text-gray-600">Preparing TMUA {year}</p>
        </div>
      </div>
    )
  }

  if (questionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Failed to load questions</h2>
          <p className="text-gray-700 mb-4">Error: {questionsError}</p>
          <div className="flex gap-3">
            <button
              onClick={() => void loadQuestions()}
              className="px-4 py-2 bg-tmua-blue text-white rounded hover:bg-blue-800"
            >
              Retry
            </button>
            <button
              onClick={handleResetProgress}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Reset Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ExamLayout
        state={session.state}
        colorScheme={session.colorScheme}
        timeLeft={timeLeft}
        currentQuestion={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE'
            ? session.currentQuestionIndex + 1
            : undefined
        }
        totalQuestions={20}
        onEndExam={handleEndExam}
        onPrevious={
          session.state === 'READING_COUNTDOWN' ||
          session.state === 'PAPER2_INSTRUCTIONS' ||
          session.state === 'SUBMIT_CONFIRM'
            ? handleStagePrevious
            : undefined
        }
        onNext={
          session.state === 'WELCOME' ||
          session.state === 'READING_COUNTDOWN' ||
          (session.state === 'PAPER1_ACTIVE' && session.currentQuestionIndex < 20) ||
          (session.state === 'PAPER2_ACTIVE' && session.currentQuestionIndex < 20)
            ? handleNext
            : undefined
        }
        onColorSchemeChange={handleColorSchemeChange}
        currentFlag={getCurrentFlag()}
        onToggleFlag={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE' ? handleToggleFlag : undefined
        }
        onNextUnanswered={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE' ? handleNextUnanswered : undefined
        }
        onNextFlagged={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE' ? handleNextFlagged : undefined
        }
        autoAdvanceEnabled={autoAdvance}
        onAutoAdvanceChange={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE' ? setAutoAdvance : undefined
        }
        onJumpToQuestion={
          session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE' ? handleJumpToQuestion : undefined
        }
        onShowNavigator={() => setShowNavigatorModal(true)}
      >
        {renderScreen()}
      </ExamLayout>

      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md">
            <h2 className="text-2xl font-bold mb-4">End Exam?</h2>
            <p className="mb-6">Are you sure you want to end the exam? Your progress will be submitted.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnd}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {showNavigatorModal && (session.state === 'PAPER1_ACTIVE' || session.state === 'PAPER2_ACTIVE') && (
        <NavigatorModal
          isOpen={showNavigatorModal}
          onClose={() => setShowNavigatorModal(false)}
          totalQuestions={20}
          answers={session.currentPaper === 1 ? session.paper1Answers : session.paper2Answers}
          flags={session.currentPaper === 1 ? session.paper1Flags : session.paper2Flags}
          onJumpToQuestion={handleJumpToQuestion}
          currentIndex={session.currentQuestionIndex}
        />
      )}

      {showPaper2ConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md">
            <h2 className="text-2xl font-bold mb-4">{session.state === 'PAPER1_ACTIVE' ? 'Go to Paper 2?' : 'Complete the TMUA?'}</h2>
            <p className="mb-6 text-gray-700">
              {session.state === 'PAPER1_ACTIVE'
                ? 'Are you sure you want to go to Paper 2?'
                : 'Are you sure you want to complete the TMUA?'}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowPaper2ConfirmModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
              >
                No
              </button>
              <button
                onClick={handleConfirmPaper2}
                className="px-6 py-2 bg-tmua-blue text-white rounded hover:bg-blue-800 font-semibold"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showResumeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Resume Previous Attempt?</h2>
            <p className="text-gray-700 mb-6">
              We found saved progress for TMUA {year}. You can continue where you left off or start a fresh attempt.
            </p>
            {(() => {
              const meta = getResumeMeta(savedSessionCandidate)
              if (!meta) return null
              return (
                <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div>Stage: {meta.state}</div>
                  <div>Answered: {meta.totalAnswered}/40</div>
                  <div>Paper 1: {meta.answeredP1}/20</div>
                  <div>Paper 2: {meta.answeredP2}/20</div>
                </div>
              )
            })()}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleResetProgress}
                className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Start Fresh
              </button>
              <button
                onClick={handleResumeSavedAttempt}
                disabled={!savedSessionCandidate}
                className="px-5 py-2 bg-tmua-blue text-white rounded hover:bg-blue-800"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed right-5 top-5 z-[60]">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
              feedback.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.message}
          </div>
        </div>
      )}
    </>
  )
}
