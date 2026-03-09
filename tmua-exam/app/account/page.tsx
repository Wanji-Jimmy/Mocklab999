'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import LatexRenderer from '@/components/LatexRenderer'
import MockLabLogo from '@/components/MockLabLogo'
import { Question } from '@/lib/types'
import {
  ExamAttempt,
  MistakeItem,
  addMistake,
  buildUserBackup,
  clearCurrentUserEmail,
  clearExamAttempts,
  clearMistakes,
  getCurrentUserEmail,
  getExamAttempts,
  getMistakes,
  removeExamAttempt,
  removeMistake,
  setExamAttempts as persistExamAttempts,
  setCurrentUserEmail,
  setMistakes as persistMistakeItems,
} from '@/lib/storage'

const CODE_LENGTH = 6
const CODE_EXPIRY_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 30 * 1000
const EMAIL_DELIVERY_ENABLED = process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED === '1'
const ACCOUNT_UI_PREFS_KEY = 'tmua_account_ui_prefs_v1'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}*@${domain}`
  return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(1, localPart.length - 2))}@${domain}`
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

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

function inferExamFromQuestionId(questionId?: string): { exam: 'tmua' | 'engaa' | 'nsaa'; part?: string } {
  const id = String(questionId || '')
  if (id.startsWith('ENGAA-')) return { exam: 'engaa' }
  if (id.startsWith('NSAA-')) {
    const partMatch = id.match(/-(part-[a-z-]+)$/)
    return { exam: 'nsaa', part: partMatch?.[1] }
  }
  return { exam: 'tmua' }
}

function getAttemptRouteMeta(attempt: ExamAttempt): { exam: 'tmua' | 'engaa' | 'nsaa'; part?: string; parts?: string[] } {
  if (attempt.exam === 'engaa') {
    return { exam: attempt.exam }
  }
  if (attempt.exam === 'nsaa') {
    if (Array.isArray(attempt.parts) && attempt.parts.length > 0) {
      return { exam: 'nsaa', part: attempt.parts[0], parts: attempt.parts }
    }
    return { exam: 'nsaa', part: attempt.part }
  }
  const ids = (attempt.questionOutcomes || []).map((outcome) => outcome.questionId)
  const inferredExam = ids.some((id) => id.startsWith('NSAA-')) ? 'nsaa' : ids.some((id) => id.startsWith('ENGAA-')) ? 'engaa' : 'tmua'
  if (inferredExam !== 'nsaa') return { exam: inferredExam }
  const inferredParts = Array.from(
    new Set(
      ids
        .map((id) => id.match(/-(part-[a-z-]+)$/)?.[1])
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 2)
  return { exam: 'nsaa', part: inferredParts[0], parts: inferredParts.length > 0 ? inferredParts : undefined }
}

function getMistakeRouteMeta(mistake: MistakeItem): { exam: 'tmua' | 'engaa' | 'nsaa'; part?: string } {
  if (mistake.exam === 'engaa' || mistake.exam === 'nsaa') {
    return { exam: mistake.exam, part: mistake.part }
  }
  return inferExamFromQuestionId(mistake.id)
}

function buildQuestionApiQuery(year: string, exam: 'tmua' | 'engaa' | 'nsaa', part?: string, parts?: string[]): string {
  const params = new URLSearchParams({ year, exam })
  if (exam === 'nsaa' && Array.isArray(parts) && parts.length > 1) {
    params.set('parts', parts.join(','))
    return params.toString()
  }
  if (exam === 'nsaa' && part) params.set('part', part)
  return params.toString()
}

function buildExamHref(
  year: string,
  paper: number,
  index: number,
  exam: 'tmua' | 'engaa' | 'nsaa',
  part?: string,
  parts?: string[],
): string {
  const suffix = `?paper=${paper}&q=${index + 1}`
  if (exam === 'engaa') return `/esat/engaa/${year}${suffix}`
  if (exam === 'nsaa' && Array.isArray(parts) && parts.length > 1) {
    const params = new URLSearchParams({ parts: parts.join(','), paper: String(paper), q: String(index + 1) })
    return `/esat/nsaa/${year}/exam?${params.toString()}`
  }
  if (exam === 'nsaa' && part) return `/esat/nsaa/${year}/${part}${suffix}`
  return `/exam/${year}${suffix}`
}

function getAttemptCacheKey(attempt: ExamAttempt): string {
  const meta = getAttemptRouteMeta(attempt)
  return `${meta.exam}:${attempt.year}:${meta.parts?.join('__') || meta.part || ''}`
}

function getAttemptTotalQuestions(attempt: ExamAttempt): number {
  const tracked = Array.isArray(attempt.questionOutcomes) ? attempt.questionOutcomes.length : 0
  if (tracked > 0) return tracked
  return attempt.scoreP3 ? 45 : 40
}

export default function AccountPage() {
  const [emailInput, setEmailInput] = useState('')
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState<MistakeItem[]>([])
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'email' | 'verify'>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''))
  const [expectedCode, setExpectedCode] = useState('')
  const [codeExpiresAt, setCodeExpiresAt] = useState(0)
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [showLocalCodePreview, setShowLocalCodePreview] = useState(false)
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null)
  const [reviewQuestionId, setReviewQuestionId] = useState<string | null>(null)
  const [reviewLoadingYear, setReviewLoadingYear] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewQuestionsByYear, setReviewQuestionsByYear] = useState<Record<string, Question[]>>({})
  const [reviewStemImageFailed, setReviewStemImageFailed] = useState(false)
  const [reviewExplanationImageFailed, setReviewExplanationImageFailed] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'unanswered' | 'correct'>('all')
  const [attemptYearFilter, setAttemptYearFilter] = useState<'ALL' | string>('ALL')
  const [attemptQuery, setAttemptQuery] = useState('')
  const [mistakeYearFilter, setMistakeYearFilter] = useState<'ALL' | string>('ALL')
  const [mistakeQuery, setMistakeQuery] = useState('')
  const [reviewJumpInput, setReviewJumpInput] = useState('')
  const [backupImportMode, setBackupImportMode] = useState<'merge' | 'replace'>('merge')
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const backupFileInputRef = useRef<HTMLInputElement | null>(null)

  const loadByEmail = (email: string | null) => {
    if (!email) {
      setMistakes([])
      setAttempts([])
      setReviewAttemptId(null)
      setReviewQuestionId(null)
      setReviewError(null)
      return
    }
    setMistakes(getMistakes(email))
    setAttempts(getExamAttempts(email))
  }

  useEffect(() => {
    const savedEmail = getCurrentUserEmail()
    setCurrentEmail(savedEmail)
    loadByEmail(savedEmail)
    setShowLocalCodePreview(!EMAIL_DELIVERY_ENABLED)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_UI_PREFS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        attemptYearFilter?: string
        attemptQuery?: string
        reviewFilter?: 'all' | 'incorrect' | 'unanswered' | 'correct'
        mistakeYearFilter?: string
        mistakeQuery?: string
      }

      if (typeof parsed.attemptYearFilter === 'string') setAttemptYearFilter(parsed.attemptYearFilter)
      if (typeof parsed.attemptQuery === 'string') setAttemptQuery(parsed.attemptQuery)
      if (
        parsed.reviewFilter === 'all' ||
        parsed.reviewFilter === 'incorrect' ||
        parsed.reviewFilter === 'unanswered' ||
        parsed.reviewFilter === 'correct'
      ) {
        setReviewFilter(parsed.reviewFilter)
      }
      if (typeof parsed.mistakeYearFilter === 'string') setMistakeYearFilter(parsed.mistakeYearFilter)
      if (typeof parsed.mistakeQuery === 'string') setMistakeQuery(parsed.mistakeQuery)
    } catch {
      // Ignore malformed preference payloads from previous builds.
    }
  }, [])

  useEffect(() => {
    const sync = () => {
      const email = getCurrentUserEmail()
      setCurrentEmail(email)
      loadByEmail(email)
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return
      if (
        event.key === 'tmua_user_email' ||
        event.key.startsWith('tmua_attempts_') ||
        event.key.startsWith('tmua_mistakes_')
      ) {
        sync()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
    }
  }, [])

  useEffect(() => {
    const payload = {
      attemptYearFilter,
      attemptQuery,
      reviewFilter,
      mistakeYearFilter,
      mistakeQuery,
    }
    localStorage.setItem(ACCOUNT_UI_PREFS_KEY, JSON.stringify(payload))
  }, [attemptYearFilter, attemptQuery, reviewFilter, mistakeYearFilter, mistakeQuery])

  const sortedMistakes = useMemo(() => {
    return [...mistakes].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  }, [mistakes])

  const mistakeYears = useMemo(() => {
    return Array.from(new Set(mistakes.map((mistake) => mistake.year))).sort((a, b) => Number(b) - Number(a))
  }, [mistakes])

  const filteredMistakes = useMemo(() => {
    const query = mistakeQuery.trim().toLowerCase()
    return sortedMistakes.filter((mistake) => {
      if (mistakeYearFilter !== 'ALL' && mistake.year !== mistakeYearFilter) return false
      if (!query) return true
      const searchable = `${mistake.id} ${mistake.year} p${mistake.paper} q${mistake.index + 1}`.toLowerCase()
      return searchable.includes(query)
    })
  }, [sortedMistakes, mistakeYearFilter, mistakeQuery])

  const sortedAttempts = useMemo(() => {
    return [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  }, [attempts])

  const yearlyPerformance = useMemo(() => {
    const grouped = new Map<string, { attempts: number; best: number; avg: number }>()
    attempts.forEach((attempt) => {
      const prev = grouped.get(attempt.year)
      if (!prev) {
        grouped.set(attempt.year, {
          attempts: 1,
          best: attempt.totalScore,
          avg: attempt.totalScore,
        })
        return
      }
      const nextAttempts = prev.attempts + 1
      grouped.set(attempt.year, {
        attempts: nextAttempts,
        best: Math.max(prev.best, attempt.totalScore),
        avg: (prev.avg * prev.attempts + attempt.totalScore) / nextAttempts,
      })
    })
    return Array.from(grouped.entries())
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => Number(b.year) - Number(a.year))
  }, [attempts])

  const attemptYears = useMemo(() => {
    return Array.from(new Set(attempts.map((attempt) => attempt.year))).sort((a, b) => Number(b) - Number(a))
  }, [attempts])

  const filteredAttempts = useMemo(() => {
    const query = attemptQuery.trim().toLowerCase()
    return sortedAttempts.filter((attempt) => {
      if (attemptYearFilter !== 'ALL' && attempt.year !== attemptYearFilter) return false
      if (!query) return true
      const searchable = `${attempt.year} ${attempt.grade.toFixed(1)} ${attempt.totalScore} ${attempt.scoreP1} ${attempt.scoreP2}`.toLowerCase()
      return searchable.includes(query)
    })
  }, [sortedAttempts, attemptYearFilter, attemptQuery])

  const selectedAttempt = useMemo(() => {
    if (!reviewAttemptId) return null
    return attempts.find((attempt) => attempt.id === reviewAttemptId) ?? null
  }, [attempts, reviewAttemptId])

  const selectedAttemptOutcomes = useMemo(() => {
    if (!selectedAttempt?.questionOutcomes || selectedAttempt.questionOutcomes.length === 0) return []
    return [...selectedAttempt.questionOutcomes].sort((a, b) => {
      if (a.paper !== b.paper) return a.paper - b.paper
      return a.index - b.index
    })
  }, [selectedAttempt])

  const selectedAttemptQuestions = useMemo(() => {
    if (!selectedAttempt) return []
    return reviewQuestionsByYear[getAttemptCacheKey(selectedAttempt)] ?? []
  }, [reviewQuestionsByYear, selectedAttempt])

  const selectedAttemptQuestionMap = useMemo(() => {
    return new Map(selectedAttemptQuestions.map((question) => [question.id, question]))
  }, [selectedAttemptQuestions])

  const reviewRows = useMemo(() => {
    return selectedAttemptOutcomes.map((outcome) => {
      const questionById = selectedAttemptQuestionMap.get(outcome.questionId)
      const questionByIndex = selectedAttemptQuestions.find(
        (question) => question.paper === outcome.paper && question.index === outcome.index,
      )
      return {
        ...outcome,
        question: questionById ?? questionByIndex,
      }
    })
  }, [selectedAttemptOutcomes, selectedAttemptQuestionMap, selectedAttemptQuestions])

  const selectedReviewRow = useMemo(() => {
    if (!reviewQuestionId) return null
    return reviewRows.find((row) => row.questionId === reviewQuestionId) ?? null
  }, [reviewRows, reviewQuestionId])

  const filteredReviewRows = useMemo(() => {
    if (reviewFilter === 'incorrect') return reviewRows.filter((row) => !row.isCorrect && Boolean(row.userAnswer))
    if (reviewFilter === 'unanswered') return reviewRows.filter((row) => !row.userAnswer)
    if (reviewFilter === 'correct') return reviewRows.filter((row) => row.isCorrect)
    return reviewRows
  }, [reviewRows, reviewFilter])

  const reviewCorrectCount = useMemo(() => reviewRows.filter((row) => row.isCorrect).length, [reviewRows])
  const reviewUnansweredCount = useMemo(() => reviewRows.filter((row) => !row.userAnswer).length, [reviewRows])
  const reviewIncorrectCount = useMemo(
    () => reviewRows.filter((row) => !row.isCorrect && Boolean(row.userAnswer)).length,
    [reviewRows],
  )

  const selectedReviewRowIndex = useMemo(() => {
    if (!reviewQuestionId) return -1
    return filteredReviewRows.findIndex((row) => row.questionId === reviewQuestionId)
  }, [filteredReviewRows, reviewQuestionId])

  const joinedCode = codeDigits.join('')
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
  const expiresSeconds = Math.max(0, Math.ceil((codeExpiresAt - now) / 1000))
  const canResend = authStep === 'verify' && resendSeconds === 0 && pendingEmail.length > 0
  const canVerify = joinedCode.length === CODE_LENGTH

  const resetAuthFlow = () => {
    setAuthStep('email')
    setPendingEmail('')
    setAuthError(null)
    setAuthMessage(null)
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setExpectedCode('')
    setCodeExpiresAt(0)
    setResendAvailableAt(0)
  }

  const issueVerificationCode = (email: string) => {
    const nextCode = String(Math.floor(100000 + Math.random() * 900000))
    const timestamp = Date.now()
    setPendingEmail(email)
    setExpectedCode(nextCode)
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setCodeExpiresAt(timestamp + CODE_EXPIRY_MS)
    setResendAvailableAt(timestamp + RESEND_COOLDOWN_MS)
    setNow(timestamp)
    setAuthError(null)
    setAuthMessage(
      showLocalCodePreview
        ? `Demo code generated for ${maskEmail(email)}.`
        : `Verification code sent to ${maskEmail(email)}.`,
    )
    setAuthStep('verify')
    console.info(`[MockLab999] One-time code for ${email}: ${nextCode}`)
    window.setTimeout(() => codeInputRefs.current[0]?.focus(), 20)
  }

  const handleStartVerification = () => {
    const normalized = emailInput.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setAuthError('Enter a valid email address.')
      return
    }
    issueVerificationCode(normalized)
  }

  const handleResendCode = () => {
    if (!canResend) return
    issueVerificationCode(pendingEmail)
  }

  const handleVerifyCode = () => {
    if (!pendingEmail || !expectedCode) {
      setAuthError('Session expired. Start again with your email.')
      setAuthStep('email')
      return
    }
    if (Date.now() > codeExpiresAt) {
      setAuthError('The code has expired. Request a new one.')
      return
    }
    if (!canVerify) {
      setAuthError(`Enter all ${CODE_LENGTH} digits.`)
      return
    }
    if (joinedCode !== expectedCode) {
      setAuthError('Incorrect verification code.')
      return
    }

    setCurrentUserEmail(pendingEmail)
    setCurrentEmail(pendingEmail)
    loadByEmail(pendingEmail)
    setEmailInput('')
    resetAuthFlow()
    setInfoMessage('Signed in successfully.')
  }

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setCodeDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    setAuthError(null)
    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      codeInputRefs.current[index - 1]?.focus()
      return
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault()
      codeInputRefs.current[index + 1]?.focus()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      handleVerifyCode()
    }
  }

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH).split('')
    if (pastedDigits.length === 0) return
    event.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    pastedDigits.forEach((digit, index) => {
      next[index] = digit
    })
    setCodeDigits(next)
    setAuthError(null)
    const focusIndex = Math.min(pastedDigits.length, CODE_LENGTH - 1)
    window.setTimeout(() => codeInputRefs.current[focusIndex]?.focus(), 10)
  }

  const handleAutoFillCode = () => {
    if (!expectedCode || expectedCode.length !== CODE_LENGTH) return
    const digits = expectedCode.split('')
    setCodeDigits(digits)
    setAuthError(null)
    window.setTimeout(() => codeInputRefs.current[CODE_LENGTH - 1]?.focus(), 10)
  }

  const handleSignOut = () => {
    clearCurrentUserEmail()
    setCurrentEmail(null)
    loadByEmail(null)
    resetAuthFlow()
    setInfoMessage('Signed out.')
  }

  const handleRemoveMistake = (questionId: string) => {
    if (!currentEmail) return
    removeMistake(currentEmail, questionId)
    loadByEmail(currentEmail)
    setInfoMessage('Question removed from mistake book.')
  }

  const handleClearMistakes = () => {
    if (!currentEmail) return
    if (!window.confirm('Clear all mistakes from your mistake book?')) return
    clearMistakes(currentEmail)
    loadByEmail(currentEmail)
    setMistakeYearFilter('ALL')
    setMistakeQuery('')
    setInfoMessage('Mistake book cleared.')
  }

  const handleRemoveFilteredMistakes = () => {
    if (!currentEmail) return
    if (filteredMistakes.length === 0) return
    if (!window.confirm(`Remove ${filteredMistakes.length} filtered mistake(s)? This cannot be undone.`)) return

    const removedMistakeIds = new Set(filteredMistakes.map((mistake) => mistake.id))
    const remainingMistakes = sortedMistakes.filter((mistake) => !removedMistakeIds.has(mistake.id))
    persistMistakeItems(currentEmail, remainingMistakes)
    loadByEmail(currentEmail)
    setInfoMessage(`Removed ${filteredMistakes.length} filtered mistake(s).`)
  }

  const handleRemoveAttempt = (attemptId: string) => {
    if (!currentEmail) return
    removeExamAttempt(currentEmail, attemptId)
    loadByEmail(currentEmail)
    setInfoMessage('Attempt removed.')
  }

  const handleClearAttempts = () => {
    if (!currentEmail) return
    if (!window.confirm('Clear all attempt history? This cannot be undone.')) return
    clearExamAttempts(currentEmail)
    loadByEmail(currentEmail)
    setAttemptYearFilter('ALL')
    setAttemptQuery('')
    setReviewAttemptId(null)
    setReviewQuestionId(null)
    setReviewError(null)
    setInfoMessage('Attempt history cleared.')
  }

  const handleRemoveFilteredAttempts = () => {
    if (!currentEmail) return
    if (filteredAttempts.length === 0) return
    if (!window.confirm(`Remove ${filteredAttempts.length} filtered attempt(s)? This cannot be undone.`)) return

    const removedAttemptIds = new Set(filteredAttempts.map((attempt) => attempt.id))
    const remainingAttempts = sortedAttempts.filter((attempt) => !removedAttemptIds.has(attempt.id))
    persistExamAttempts(currentEmail, remainingAttempts)
    loadByEmail(currentEmail)
    setInfoMessage(`Removed ${filteredAttempts.length} filtered attempt(s).`)
  }

  const handleResetAttemptFilters = () => {
    setAttemptYearFilter('ALL')
    setAttemptQuery('')
  }

  const handleOpenAttemptReview = async (attempt: ExamAttempt) => {
    setReviewAttemptId(attempt.id)
    setReviewQuestionId(null)
    setReviewError(null)
    setReviewFilter('all')

    if (!attempt.questionOutcomes || attempt.questionOutcomes.length === 0) {
      return
    }

    const meta = getAttemptRouteMeta(attempt)
    const cacheKey = getAttemptCacheKey(attempt)

    if (reviewQuestionsByYear[cacheKey]) {
      return
    }

    setReviewLoadingYear(attempt.year)
    try {
      const response = await fetch(`/api/questions?${buildQuestionApiQuery(attempt.year, meta.exam, meta.part, meta.parts)}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const payload = (await response.json()) as Question[]
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error('No questions found')
      }
      const sorted = [...payload].sort((a, b) => {
        if (a.paper !== b.paper) return a.paper - b.paper
        return a.index - b.index
      })
      setReviewQuestionsByYear((prev) => ({ ...prev, [cacheKey]: sorted }))
    } catch {
      setReviewError(`Failed to load question set for ${attempt.year}.`)
    } finally {
      setReviewLoadingYear((prev) => (prev === attempt.year ? null : prev))
    }
  }

  const handleCloseAttemptReview = () => {
    setReviewAttemptId(null)
    setReviewQuestionId(null)
    setReviewError(null)
    setReviewFilter('all')
  }

  const handleAddReviewedQuestionToMistakes = (question?: Question) => {
    if (!currentEmail || !question) return
    const added = addMistake(currentEmail, question)
    if (added) {
      loadByEmail(currentEmail)
      setInfoMessage('Question added to mistake book.')
      return
    }
    setInfoMessage('Question already exists in your mistake book.')
  }

  const handleAddAllIncorrectToMistakes = () => {
    if (!currentEmail || reviewRows.length === 0) return
    let addedCount = 0
    let duplicateCount = 0
    for (const row of reviewRows) {
      if (row.isCorrect || !row.userAnswer || !row.question) continue
      const added = addMistake(currentEmail, row.question)
      if (added) addedCount += 1
      else duplicateCount += 1
    }
    loadByEmail(currentEmail)
    if (addedCount === 0 && duplicateCount === 0) {
      setInfoMessage('No incorrect questions found in this attempt.')
      return
    }
    if (addedCount === 0) {
      setInfoMessage('All incorrect questions were already in your mistake book.')
      return
    }
    setInfoMessage(
      duplicateCount > 0
        ? `Added ${addedCount} incorrect question(s), skipped ${duplicateCount} duplicate(s).`
        : `Added ${addedCount} incorrect question(s) to mistake book.`,
    )
  }

  const handleAddFilteredReviewToMistakes = () => {
    if (!currentEmail || filteredReviewRows.length === 0) return

    let addedCount = 0
    let duplicateCount = 0
    let skippedCount = 0

    for (const row of filteredReviewRows) {
      if (row.isCorrect || !row.userAnswer || !row.question) {
        skippedCount += 1
        continue
      }
      const added = addMistake(currentEmail, row.question)
      if (added) addedCount += 1
      else duplicateCount += 1
    }

    loadByEmail(currentEmail)

    if (addedCount === 0 && duplicateCount === 0) {
      setInfoMessage('No incorrect questions found in the current review filter.')
      return
    }
    if (addedCount === 0) {
      setInfoMessage('All filtered incorrect questions were already in your mistake book.')
      return
    }

    const base =
      duplicateCount > 0
        ? `Added ${addedCount} filtered incorrect question(s), skipped ${duplicateCount} duplicate(s).`
        : `Added ${addedCount} filtered incorrect question(s) to mistake book.`
    setInfoMessage(skippedCount > 0 ? `${base} ${skippedCount} row(s) were not incorrect.` : base)
  }

  const handleExportBackup = () => {
    if (!currentEmail) return
    const backup = buildUserBackup(currentEmail)
    const payload = JSON.stringify(backup, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-backup-${currentEmail.replace(/[^a-z0-9]/gi, '_')}-${date}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setInfoMessage('Backup file downloaded.')
  }

  const downloadAttemptsCsv = (sourceAttempts: ExamAttempt[], fileLabel: 'report' | 'filtered'): boolean => {
    if (!currentEmail) return false
    if (sourceAttempts.length === 0) return false

    const rows = [
      ['Attempt ID', 'Year', 'Taken At', 'Paper 1', 'Paper 2', 'Total', 'Grade', 'Question Outcomes'],
      ...sourceAttempts.map((attempt) => [
        attempt.id,
        attempt.year,
        attempt.takenAt,
        attempt.scoreP1,
        attempt.scoreP2,
        attempt.totalScore,
        attempt.grade.toFixed(1),
        Array.isArray(attempt.questionOutcomes) ? attempt.questionOutcomes.length : 0,
      ]),
    ]

    const csv = `\uFEFF${rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-attempt-${fileLabel}-${currentEmail.replace(/[^a-z0-9]/gi, '_')}-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    return true
  }

  const handleExportAttemptsCsv = () => {
    if (!currentEmail) return
    if (sortedAttempts.length === 0) {
      setInfoMessage('No attempts available for CSV export.')
      return
    }

    const ok = downloadAttemptsCsv(sortedAttempts, 'report')
    if (ok) setInfoMessage('Attempt CSV report downloaded.')
  }

  const handleExportFilteredAttemptsCsv = () => {
    if (!currentEmail) return
    if (filteredAttempts.length === 0) {
      setInfoMessage('No filtered attempts available for CSV export.')
      return
    }
    const ok = downloadAttemptsCsv(filteredAttempts, 'filtered')
    if (ok) setInfoMessage('Filtered attempt CSV report downloaded.')
  }

  const handleSelectPreviousReviewQuestion = () => {
    if (selectedReviewRowIndex <= 0) return
    setReviewQuestionId(filteredReviewRows[selectedReviewRowIndex - 1].questionId)
  }

  const handleSelectNextReviewQuestion = () => {
    if (selectedReviewRowIndex < 0 || selectedReviewRowIndex >= filteredReviewRows.length - 1) return
    setReviewQuestionId(filteredReviewRows[selectedReviewRowIndex + 1].questionId)
  }

  const handleJumpToReviewRow = () => {
    if (filteredReviewRows.length === 0) return
    const parsed = Number.parseInt(reviewJumpInput.trim(), 10)
    if (!Number.isFinite(parsed)) {
      setInfoMessage('Enter a valid question number to jump.')
      return
    }
    if (parsed < 1 || parsed > filteredReviewRows.length) {
      setInfoMessage(`Jump target must be between 1 and ${filteredReviewRows.length}.`)
      return
    }
    setReviewQuestionId(filteredReviewRows[parsed - 1].questionId)
    setReviewJumpInput('')
  }

  const handleExportFilteredReviewCsv = () => {
    if (!currentEmail || !selectedAttempt) return
    if (filteredReviewRows.length === 0) {
      setInfoMessage('No review questions available for CSV export.')
      return
    }

    const rows = [
      ['Question ID', 'Year', 'Paper', 'Question', 'Status', 'Your Answer', 'Correct Answer'],
      ...filteredReviewRows.map((row) => [
        row.questionId,
        selectedAttempt.year,
        row.paper,
        row.index + 1,
        row.isCorrect ? 'Correct' : row.userAnswer ? 'Incorrect' : 'Unanswered',
        row.userAnswer || '',
        row.correctAnswer,
      ]),
    ]

    const csv = `\uFEFF${rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-review-${selectedAttempt.year}-${selectedAttempt.id}-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setInfoMessage('Filtered review CSV downloaded.')
  }

  const handleExportFilteredMistakesCsv = () => {
    if (!currentEmail) return
    if (filteredMistakes.length === 0) {
      setInfoMessage('No filtered mistakes available for CSV export.')
      return
    }

    const rows = [
      ['Question ID', 'Year', 'Paper', 'Question', 'Saved At'],
      ...filteredMistakes.map((mistake) => [
        mistake.id,
        mistake.year,
        mistake.paper,
        mistake.index + 1,
        mistake.addedAt,
      ]),
    ]

    const csv = `\uFEFF${rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `mocklab999-mistakes-${currentEmail.replace(/[^a-z0-9]/gi, '_')}-${date}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setInfoMessage('Filtered mistakes CSV downloaded.')
  }

  const handleResetMistakeFilters = () => {
    setMistakeYearFilter('ALL')
    setMistakeQuery('')
  }

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentEmail) return
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as {
        email?: string
        attempts?: ExamAttempt[]
        mistakes?: MistakeItem[]
      }

      if (parsed.email && parsed.email.toLowerCase() !== currentEmail) {
        const shouldImport = window.confirm(
          `This backup belongs to ${parsed.email}. Import it into the current account (${currentEmail})?`,
        )
        if (!shouldImport) {
          event.target.value = ''
          return
        }
      }

      const importedAttempts = Array.isArray(parsed.attempts) ? parsed.attempts : []
      const importedMistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : []

      if (importedAttempts.length === 0 && importedMistakes.length === 0) {
        setInfoMessage('Backup file has no attempts or mistakes to import.')
        event.target.value = ''
        return
      }

      const normalizedImportedAttempts = Array.from(
        new Map(
          importedAttempts
            .filter((attempt) => attempt && typeof attempt.id === 'string')
            .map((attempt) => [attempt.id, attempt]),
        ).values(),
      ).sort((a, b) => String(b.takenAt || '').localeCompare(String(a.takenAt || '')))

      const normalizedImportedMistakes = Array.from(
        new Map(
          importedMistakes
            .filter((mistake) => mistake && typeof mistake.id === 'string')
            .map((mistake) => [mistake.id, mistake]),
        ).values(),
      ).sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')))

      if (backupImportMode === 'replace') {
        const shouldReplace = window.confirm(
          `Replace current data with backup data?\nAttempts: ${normalizedImportedAttempts.length}, Mistakes: ${normalizedImportedMistakes.length}`,
        )
        if (!shouldReplace) {
          event.target.value = ''
          return
        }

        persistExamAttempts(currentEmail, normalizedImportedAttempts)
        persistMistakeItems(currentEmail, normalizedImportedMistakes)
        loadByEmail(currentEmail)
        setInfoMessage(
          `Backup restored: ${normalizedImportedAttempts.length} attempt(s), ${normalizedImportedMistakes.length} mistake(s).`,
        )
        event.target.value = ''
        return
      }

      const existingAttempts = getExamAttempts(currentEmail)
      const existingMistakes = getMistakes(currentEmail)

      const attemptMap = new Map(existingAttempts.map((attempt) => [attempt.id, attempt]))
      normalizedImportedAttempts.forEach((attempt) => {
        if (!attempt || typeof attempt.id !== 'string') return
        attemptMap.set(attempt.id, attempt)
      })
      const mergedAttempts = Array.from(attemptMap.values()).sort((a, b) => b.takenAt.localeCompare(a.takenAt))

      const mistakeMap = new Map(existingMistakes.map((mistake) => [mistake.id, mistake]))
      normalizedImportedMistakes.forEach((mistake) => {
        if (!mistake || typeof mistake.id !== 'string') return
        mistakeMap.set(mistake.id, mistake)
      })
      const mergedMistakes = Array.from(mistakeMap.values()).sort((a, b) => b.addedAt.localeCompare(a.addedAt))

      persistExamAttempts(currentEmail, mergedAttempts)
      persistMistakeItems(currentEmail, mergedMistakes)
      loadByEmail(currentEmail)

      const addedAttempts = Math.max(0, mergedAttempts.length - existingAttempts.length)
      const addedMistakes = Math.max(0, mergedMistakes.length - existingMistakes.length)
      setInfoMessage(`Import complete: +${addedAttempts} attempt(s), +${addedMistakes} mistake(s).`)
    } catch {
      setInfoMessage('Invalid backup file. Please select a valid JSON export.')
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    if (!infoMessage) return
    const timer = window.setTimeout(() => setInfoMessage(null), 2200)
    return () => window.clearTimeout(timer)
  }, [infoMessage])

  useEffect(() => {
    if (!authMessage) return
    const timer = window.setTimeout(() => setAuthMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [authMessage])

  useEffect(() => {
    if (authStep !== 'verify') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [authStep])

  useEffect(() => {
    if (!reviewAttemptId) return
    const exists = attempts.some((attempt) => attempt.id === reviewAttemptId)
    if (!exists) {
      setReviewAttemptId(null)
      setReviewQuestionId(null)
      setReviewError(null)
    }
  }, [attempts, reviewAttemptId])

  useEffect(() => {
    if (reviewRows.length === 0) {
      setReviewQuestionId(null)
      return
    }
    if (filteredReviewRows.length === 0) {
      setReviewQuestionId(null)
      return
    }
    if (!reviewQuestionId || !filteredReviewRows.some((row) => row.questionId === reviewQuestionId)) {
      setReviewQuestionId(filteredReviewRows[0].questionId)
    }
  }, [reviewRows, filteredReviewRows, reviewQuestionId])

  useEffect(() => {
    setReviewStemImageFailed(false)
    setReviewExplanationImageFailed(false)
  }, [selectedReviewRow?.question?.id])

  useEffect(() => {
    setReviewJumpInput('')
  }, [selectedAttempt?.id, reviewFilter])

  const handleResetReviewFilter = () => {
    setReviewFilter('all')
    setReviewJumpInput('')
  }

  useEffect(() => {
    if (!selectedAttempt || filteredReviewRows.length === 0) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (!reviewQuestionId) return

      if (event.key === 'ArrowLeft') {
        if (selectedReviewRowIndex <= 0) return
        event.preventDefault()
        setReviewQuestionId(filteredReviewRows[selectedReviewRowIndex - 1].questionId)
        return
      }

      if (selectedReviewRowIndex < 0 || selectedReviewRowIndex >= filteredReviewRows.length - 1) return
      event.preventDefault()
      setReviewQuestionId(filteredReviewRows[selectedReviewRowIndex + 1].questionId)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedAttempt, filteredReviewRows, reviewQuestionId, selectedReviewRowIndex])

  return (
    <div className="warm-shell relative overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop tone="warm" />
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <MockLabLogo tone="warm" />
          <div className="flex gap-2">
            <Link href="/dashboard" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Dashboard
            </Link>
            <Link href="/" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Intro
            </Link>
          </div>
        </div>

        <header className="warm-card rounded-3xl p-7 md:p-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Personal Workspace</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">My Account</h1>
            <p className="mt-2 text-slate-600">View your exam history and manage your mistake book in one place.</p>
          </div>
          <Link href="/dashboard" className="warm-outline-btn px-4 py-2 rounded-lg text-sm">
            Back to Dashboard
          </Link>
        </header>

        <section className="warm-card rounded-2xl p-6 md:p-7">
          <h2 className="font-bold text-slate-900 text-xl">Account Security</h2>

          {!currentEmail ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
              <div className="warm-card-muted rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Passwordless Login</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Modern sign-in flow with one-time code verification</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Enter your email, receive a short verification code, then unlock your personal dashboard, history, and mistakes.
                </p>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>• Two-step flow designed like mainstream productivity apps.</p>
                  <p>• Session is tied to your verified email on this device.</p>
                  <p>• No plain-text password field in the account screen.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    {authStep === 'email' ? 'Step 1 of 2 · Email' : 'Step 2 of 2 · Verification'}
                  </p>
                  {authStep === 'verify' && (
                    <button
                      onClick={resetAuthFlow}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Change Email
                    </button>
                  )}
                </div>

                {authStep === 'email' ? (
                  <div className="mt-4 space-y-3">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={emailInput}
                      onChange={(event) => {
                        setEmailInput(event.target.value)
                        setAuthError(null)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleStartVerification()
                        }
                      }}
                      placeholder="name@school.edu"
                      className="warm-focus-input w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    />
                    <button
                      onClick={handleStartVerification}
                      className="warm-primary-btn w-full rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={emailInput.trim().length === 0}
                    >
                      Continue with Email
                    </button>
                    <p className="text-xs text-slate-500">
                      {EMAIL_DELIVERY_ENABLED
                        ? 'One-time code verification only. Check your inbox for the verification code.'
                        : 'Demo mode: code appears below after you continue. Email delivery is currently disabled.'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-600">
                      Enter the 6-digit code for <span className="font-semibold text-slate-800">{maskEmail(pendingEmail)}</span>.
                    </p>

                    {showLocalCodePreview && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <div>
                          Local preview code: <span className="font-semibold tracking-wider">{expectedCode}</span>
                        </div>
                        <button
                          onClick={handleAutoFillCode}
                          className="mt-2 warm-outline-btn px-2 py-1 rounded-md text-xs"
                        >
                          Auto Fill Code
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            codeInputRefs.current[index] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={codeDigits[index]}
                          onChange={(event) => handleCodeChange(index, event.target.value)}
                          onKeyDown={(event) => handleCodeKeyDown(index, event)}
                          onPaste={handleCodePaste}
                          className="warm-focus-input h-12 w-full rounded-xl border border-slate-300 bg-white text-center text-lg font-bold tracking-widest text-slate-900"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={expiresSeconds > 0 ? 'text-slate-500' : 'text-red-600 font-semibold'}>
                        {expiresSeconds > 0 ? `Code expires in ${formatCountdown(expiresSeconds)}` : 'Code expired'}
                      </span>
                      <button
                        onClick={handleResendCode}
                        className="warm-link-text font-semibold disabled:text-slate-400"
                        disabled={!canResend}
                      >
                        {canResend ? 'Resend Code' : `Resend in ${resendSeconds}s`}
                      </button>
                    </div>

                    <button
                      onClick={handleVerifyCode}
                      className="warm-primary-btn w-full rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canVerify}
                    >
                      Verify and Sign In
                    </button>
                  </div>
                )}

                {authError && <p className="mt-3 text-sm text-red-600">{authError}</p>}
                {authMessage && <p className="mt-3 text-sm text-emerald-700">{authMessage}</p>}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#ff8a3c] to-[#ff5e00] text-lg font-black text-white">
                  {currentEmail.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Verified Session</div>
                  <div className="font-semibold text-slate-900 break-all">{currentEmail}</div>
                  <div className="text-xs text-slate-500">Passwordless account access active on this device</div>
                </div>
              </div>
              <button onClick={handleSignOut} className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
                Sign Out
              </button>
            </div>
          )}
        </section>

        {currentEmail && (
          <>
            <section className="warm-card rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-xl">Data Backup</h2>
                  <p className="text-sm text-slate-600 mt-1">Export your attempts and mistake book, then import on another device.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={backupImportMode}
                    onChange={(event) => setBackupImportMode(event.target.value as 'merge' | 'replace')}
                    className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                  >
                    <option value="merge">Merge (recommended)</option>
                    <option value="replace">Replace current data</option>
                  </select>
                  <button onClick={handleExportBackup} className="warm-primary-btn px-4 py-2 rounded-lg text-sm">
                    Export Backup
                  </button>
                  <button onClick={handleExportAttemptsCsv} className="warm-outline-btn px-4 py-2 rounded-lg text-sm">
                    Export CSV Report
                  </button>
                  <button
                    onClick={() => backupFileInputRef.current?.click()}
                    className="warm-outline-btn px-4 py-2 rounded-lg text-sm"
                  >
                    Import Backup
                  </button>
                </div>
              </div>
              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  void handleImportBackup(event)
                }}
              />
            </section>

            <section className="warm-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-xl">Mock Exam History</h2>
                  <p className="text-sm text-slate-600 mt-1">Your completed attempts across different years.</p>
                </div>
                {attempts.length > 0 && (
                  <button onClick={handleClearAttempts} className="text-xs text-red-700 hover:underline">
                    Clear All History
                  </button>
                )}
              </div>

              {attempts.length === 0 ? (
                <p className="text-sm text-slate-600 mt-4">No completed attempts yet.</p>
              ) : (
                <>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Year-by-Year Performance</h3>
                    <div className="space-y-3">
                      {yearlyPerformance.map((entry) => (
                        <div key={entry.year}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">
                              {entry.year} ({entry.attempts} attempt{entry.attempts === 1 ? '' : 's'})
                            </span>
                            <span className="text-slate-600">
                              Best {entry.best} | Avg {entry.avg.toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#ff8a3c] to-[#ff5e00]"
                              style={{ width: `${Math.round((entry.best / 45) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <select
                      value={attemptYearFilter}
                      onChange={(event) => setAttemptYearFilter(event.target.value)}
                      className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    >
                      <option value="ALL">All years</option>
                      {attemptYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <input
                      value={attemptQuery}
                      onChange={(event) => setAttemptQuery(event.target.value)}
                      placeholder="Search score, grade..."
                      className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm min-w-[220px]"
                    />
                    <button
                      onClick={handleExportFilteredAttemptsCsv}
                      disabled={filteredAttempts.length === 0}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export Filtered CSV
                    </button>
                    <button
                      onClick={handleResetAttemptFilters}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-xs"
                    >
                      Reset Attempt Filters
                    </button>
                    <button
                      onClick={handleRemoveFilteredAttempts}
                      disabled={filteredAttempts.length === 0}
                      className="warm-outline-btn px-3 py-2 border border-red-200 text-red-700 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
                    >
                      Remove Filtered Attempts
                    </button>
                    <div className="ml-auto text-xs text-slate-500">
                      Showing {filteredAttempts.length} / {sortedAttempts.length}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {filteredAttempts.map((attempt) => (
                      <div key={attempt.id} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-slate-900">
                            {attempt.year} | Grade {attempt.grade.toFixed(1)} | Score {attempt.totalScore}/{getAttemptTotalQuestions(attempt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-500">{new Date(attempt.takenAt).toLocaleString()}</div>
                            <button
                              onClick={() => {
                                void handleOpenAttemptReview(attempt)
                              }}
                              className="warm-outline-btn px-2.5 py-1 text-xs rounded-md"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleRemoveAttempt(attempt.id)}
                              className="text-xs text-red-700 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Paper 1: {attempt.scoreP1}/20, Paper 2: {attempt.scoreP2}/{attempt.scoreP3 ? 5 : 20}
                          {attempt.scoreP3 ? `, Paper 3: ${attempt.scoreP3}/5` : ''}
                        </div>
                        {(!attempt.questionOutcomes || attempt.questionOutcomes.length === 0) && (
                          <div className="text-xs text-amber-700 mt-1">
                            Detailed review unavailable for this older attempt.
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredAttempts.length === 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        No attempts match this filter.
                      </div>
                    )}
                  </div>

                  {selectedAttempt && (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Attempt Review · {selectedAttempt.year} · Score {selectedAttempt.totalScore}/{getAttemptTotalQuestions(selectedAttempt)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Inspect each question, verify your answer, and reopen exact exam positions.
                          </p>
                        </div>
                        <button onClick={handleCloseAttemptReview} className="warm-outline-btn px-3 py-2 rounded-lg text-xs">
                          Close
                        </button>
                      </div>

                      {!selectedAttempt.questionOutcomes || selectedAttempt.questionOutcomes.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          This attempt was saved before detailed review tracking was enabled.
                        </div>
                      ) : reviewLoadingYear === selectedAttempt.year ? (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          Loading question details...
                        </div>
                      ) : reviewError ? (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {reviewError}
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                              Correct: {reviewCorrectCount}
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                              Incorrect: {reviewIncorrectCount}
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              Unanswered: {reviewUnansweredCount}
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              Questions: {reviewRows.length}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setReviewFilter('all')}
                              className={`px-3 py-1.5 rounded-full text-xs border ${
                                reviewFilter === 'all'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              All ({reviewRows.length})
                            </button>
                            <button
                              onClick={() => setReviewFilter('incorrect')}
                              className={`px-3 py-1.5 rounded-full text-xs border ${
                                reviewFilter === 'incorrect'
                                  ? 'bg-red-700 text-white border-red-700'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              Incorrect ({reviewIncorrectCount})
                            </button>
                            <button
                              onClick={() => setReviewFilter('unanswered')}
                              className={`px-3 py-1.5 rounded-full text-xs border ${
                                reviewFilter === 'unanswered'
                                  ? 'bg-amber-700 text-white border-amber-700'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              Unanswered ({reviewUnansweredCount})
                            </button>
                            <button
                              onClick={() => setReviewFilter('correct')}
                              className={`px-3 py-1.5 rounded-full text-xs border ${
                                reviewFilter === 'correct'
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              Correct ({reviewCorrectCount})
                            </button>
                            <button
                              onClick={handleResetReviewFilter}
                              className="warm-outline-btn px-3 py-1.5 rounded-full text-xs"
                            >
                              Reset Review Filter
                            </button>
                            <button
                              onClick={handleAddAllIncorrectToMistakes}
                              className="warm-outline-btn px-3 py-1.5 rounded-full text-xs ml-auto"
                            >
                              Add All Incorrect to Mistake Book
                            </button>
                            <button
                              onClick={handleAddFilteredReviewToMistakes}
                              className="warm-outline-btn px-3 py-1.5 rounded-full text-xs"
                            >
                              Add Filtered to Mistake Book
                            </button>
                            <button
                              onClick={handleExportFilteredReviewCsv}
                              className="warm-outline-btn px-3 py-1.5 rounded-full text-xs"
                            >
                              Export Review CSV
                            </button>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 max-h-[32rem] overflow-auto space-y-2">
                              {filteredReviewRows.map((row) => {
                                const selected = reviewQuestionId === row.questionId
                                const isUnanswered = !row.userAnswer
                                const statusClass = row.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : isUnanswered
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-red-300 bg-red-50'
                                const statusLabel = row.isCorrect ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect'
                                return (
                                  <button
                                    key={row.questionId}
                                    onClick={() => setReviewQuestionId(row.questionId)}
                                    className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                                      selected ? 'border-slate-800 bg-white shadow-sm' : statusClass
                                    }`}
                                  >
                                    <div className="font-semibold text-slate-900">
                                      Paper {row.paper} · Question {row.index + 1}
                                    </div>
                                    <div className="text-xs mt-1 text-slate-700">
                                      {statusLabel} · Your {row.userAnswer || 'No answer'} · Key{' '}
                                      {row.correctAnswer}
                                    </div>
                                  </button>
                                )
                              })}
                              {filteredReviewRows.length === 0 && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                  No questions match this filter.
                                </div>
                              )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              {!selectedReviewRow ? (
                                <p className="text-sm text-slate-600">Select a question from the left list to inspect details.</p>
                              ) : !selectedReviewRow.question ? (
                                <div className="space-y-3">
                                  <p className="text-sm text-slate-600">
                                    Question content could not be matched for this record. You can still jump into exam mode.
                                  </p>
                                  <Link
                                    href={buildExamHref(
                                      selectedAttempt.year,
                                      selectedReviewRow.paper,
                                      selectedReviewRow.index,
                                      getAttemptRouteMeta(selectedAttempt).exam,
                                      getAttemptRouteMeta(selectedAttempt).part,
                                      getAttemptRouteMeta(selectedAttempt).parts,
                                    )}
                                    className="warm-primary-btn px-3 py-2 rounded-lg text-sm inline-flex"
                                  >
                                    Open in Exam
                                  </Link>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-bold text-slate-900">
                                      Paper {selectedReviewRow.paper}, Question {selectedReviewRow.index + 1}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleSelectPreviousReviewQuestion}
                                        disabled={selectedReviewRowIndex <= 0}
                                        className="warm-outline-btn px-2 py-1 rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Previous
                                      </button>
                                      <span className="text-xs text-slate-500">
                                        {selectedReviewRowIndex + 1}/{filteredReviewRows.length}
                                      </span>
                                      <button
                                        onClick={handleSelectNextReviewQuestion}
                                        disabled={
                                          selectedReviewRowIndex < 0 || selectedReviewRowIndex >= filteredReviewRows.length - 1
                                        }
                                        className="warm-outline-btn px-2 py-1 rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Next
                                      </button>
                                      <input
                                        value={reviewJumpInput}
                                        onChange={(event) => setReviewJumpInput(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') {
                                            event.preventDefault()
                                            handleJumpToReviewRow()
                                          }
                                        }}
                                        placeholder="#"
                                        className="warm-focus-input w-14 px-2 py-1 border border-slate-300 rounded-md bg-white text-xs text-center"
                                      />
                                      <button
                                        onClick={handleJumpToReviewRow}
                                        className="warm-outline-btn px-2 py-1 rounded-md text-xs"
                                      >
                                        Go
                                      </button>
                                      <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                          selectedReviewRow.isCorrect
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : selectedReviewRow.userAnswer
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-amber-100 text-amber-700'
                                        }`}
                                      >
                                        {selectedReviewRow.isCorrect
                                          ? 'Correct'
                                          : selectedReviewRow.userAnswer
                                            ? 'Incorrect'
                                            : 'Unanswered'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                                    <div>
                                      Your answer:{' '}
                                      <span className="font-semibold text-slate-900">
                                        {selectedReviewRow.userAnswer || 'No answer'}
                                      </span>
                                    </div>
                                    <div>
                                      Correct answer:{' '}
                                      <span className="font-semibold text-emerald-700">{selectedReviewRow.correctAnswer}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Question</h4>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed">
                                      <LatexRenderer latex={selectedReviewRow.question.stemLatex} />
                                      {selectedReviewRow.question.stemImage && !reviewStemImageFailed && (
                                        <img
                                          src={selectedReviewRow.question.stemImage}
                                          alt="Question stem"
                                          className="mt-3 max-w-full h-auto rounded-lg border border-slate-200 bg-white"
                                          onError={() => setReviewStemImageFailed(true)}
                                        />
                                      )}
                                      {selectedReviewRow.question.stemImage && reviewStemImageFailed && (
                                        <p className="mt-2 text-xs text-amber-700">Question image failed to load on this device.</p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Options</h4>
                                    <div className="space-y-2">
                                      {selectedReviewRow.question.options.map((option) => {
                                        const isCorrectOption = option.key === selectedReviewRow.correctAnswer
                                        const isChosenWrong =
                                          option.key === selectedReviewRow.userAnswer &&
                                          selectedReviewRow.userAnswer !== selectedReviewRow.correctAnswer
                                        const optionClass = isCorrectOption
                                          ? 'border-emerald-300 bg-emerald-50'
                                          : isChosenWrong
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200 bg-white'
                                        return (
                                          <div key={option.key} className={`rounded-lg border p-3 text-sm ${optionClass}`}>
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
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Explanation</h4>
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed">
                                      <LatexRenderer latex={selectedReviewRow.question.explanationLatex} />
                                      {selectedReviewRow.question.explanationImage && !reviewExplanationImageFailed && (
                                        <img
                                          src={selectedReviewRow.question.explanationImage}
                                          alt="Question explanation"
                                          className="mt-3 max-w-full h-auto rounded-lg border border-blue-200 bg-white"
                                          onError={() => setReviewExplanationImageFailed(true)}
                                        />
                                      )}
                                      {selectedReviewRow.question.explanationImage && reviewExplanationImageFailed && (
                                        <p className="mt-2 text-xs text-amber-700">
                                          Explanation image failed to load on this device.
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Link
                                      href={buildExamHref(
                                        selectedAttempt.year,
                                        selectedReviewRow.paper,
                                        selectedReviewRow.index,
                                        getAttemptRouteMeta(selectedAttempt).exam,
                                        getAttemptRouteMeta(selectedAttempt).part,
                                        getAttemptRouteMeta(selectedAttempt).parts,
                                      )}
                                      className="warm-primary-btn px-3 py-2 rounded-lg text-sm"
                                    >
                                      Open in Exam
                                    </Link>
                                    <button
                                      onClick={() => handleAddReviewedQuestionToMistakes(selectedReviewRow.question)}
                                      className="warm-outline-btn px-3 py-2 rounded-lg text-sm"
                                    >
                                      Add to Mistake Book
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="warm-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-xl">Mistake Book</h2>
                  <p className="text-sm text-slate-600 mt-1">Your saved mistakes from past mock exams.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link href="/mistakes" className="warm-link-text text-sm hover:underline whitespace-nowrap">
                    Open Mistake Center
                  </Link>
                  {sortedMistakes.length > 0 && (
                    <button onClick={handleClearMistakes} className="text-xs text-red-700 hover:underline whitespace-nowrap">
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {sortedMistakes.length === 0 ? (
                <p className="text-sm text-slate-600 mt-4">No mistakes saved yet.</p>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <select
                      value={mistakeYearFilter}
                      onChange={(event) => setMistakeYearFilter(event.target.value)}
                      className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    >
                      <option value="ALL">All years</option>
                      {mistakeYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <input
                      value={mistakeQuery}
                      onChange={(event) => setMistakeQuery(event.target.value)}
                      placeholder="Search ID, year, paper..."
                      className="warm-focus-input px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm min-w-[220px]"
                    />
                    <button
                      onClick={handleExportFilteredMistakesCsv}
                      disabled={filteredMistakes.length === 0}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export Filtered CSV
                    </button>
                    <button
                      onClick={handleResetMistakeFilters}
                      className="warm-outline-btn px-3 py-2 rounded-lg text-xs"
                    >
                      Reset Mistake Filters
                    </button>
                    <button
                      onClick={handleRemoveFilteredMistakes}
                      disabled={filteredMistakes.length === 0}
                      className="warm-outline-btn px-3 py-2 border border-red-200 text-red-700 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
                    >
                      Remove Filtered Mistakes
                    </button>
                    <div className="ml-auto text-xs text-slate-500">
                      Showing {filteredMistakes.length} / {sortedMistakes.length}
                    </div>
                  </div>

                  <div className="mt-3 max-h-64 overflow-auto space-y-2 pr-1">
                    {filteredMistakes.map((mistake) => (
                      <div key={mistake.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                        <div className="font-semibold text-slate-900">{mistake.year} Paper {mistake.paper} Question {mistake.index + 1}</div>
                        <div className="text-xs text-slate-500 mt-1">Saved {new Date(mistake.addedAt).toLocaleString()}</div>
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={buildExamHref(
                              mistake.year,
                              mistake.paper,
                              mistake.index,
                              getMistakeRouteMeta(mistake).exam,
                              getMistakeRouteMeta(mistake).part,
                              undefined,
                            )}
                            className="warm-primary-btn px-2.5 py-1.5 text-xs rounded-md"
                          >
                            Open
                          </Link>
                          <button
                            onClick={() => handleRemoveMistake(mistake.id)}
                            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredMistakes.length === 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        No mistakes match this filter.
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
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
