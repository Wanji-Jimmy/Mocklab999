import { Question } from '@/lib/types'

export interface MistakeItem {
  id: string
  year: string
  paper: number
  index: number
  addedAt: string
}

export interface AttemptQuestionOutcome {
  questionId: string
  paper: number
  index: number
  userAnswer?: string
  correctAnswer: string
  isCorrect: boolean
}

export interface ExamAttempt {
  id: string
  year: string
  scoreP1: number
  scoreP2: number
  totalScore: number
  grade: number
  takenAt: string
  questionOutcomes?: AttemptQuestionOutcome[]
}

export interface UserDataBackup {
  version: 1
  exportedAt: string
  email: string
  attempts: ExamAttempt[]
  mistakes: MistakeItem[]
}

const USER_EMAIL_KEY = 'tmua_user_email'

function mistakesKey(email: string): string {
  return `tmua_mistakes_${email.toLowerCase()}`
}

function attemptsKey(email: string): string {
  return `tmua_attempts_${email.toLowerCase()}`
}

export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_EMAIL_KEY)
}

export function setCurrentUserEmail(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_EMAIL_KEY, email.toLowerCase())
}

export function clearCurrentUserEmail(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_EMAIL_KEY)
}

export function getMistakes(email: string): MistakeItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(mistakesKey(email))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as MistakeItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setMistakes(email: string, mistakes: MistakeItem[]): void {
  if (typeof window === 'undefined') return
  const normalized = Array.isArray(mistakes)
    ? mistakes
        .filter((item) => item && typeof item.id === 'string')
        .map((item) => ({
          id: String(item.id),
          year: String(item.year || 'Unknown'),
          paper: Number(item.paper) || 1,
          index: Number(item.index) || 0,
          addedAt: String(item.addedAt || new Date().toISOString()),
        }))
    : []
  localStorage.setItem(mistakesKey(email), JSON.stringify(normalized))
}

export function addMistake(email: string, question: Question): boolean {
  if (typeof window === 'undefined') return false
  const existing = getMistakes(email)
  if (existing.some((m) => m.id === question.id)) return false

  const yearTag = question.tags.find((t) => /^20\d{2}$/.test(t)) ?? 'Unknown'
  const next: MistakeItem[] = [
    ...existing,
    {
      id: question.id,
      year: yearTag,
      paper: question.paper,
      index: question.index,
      addedAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(mistakesKey(email), JSON.stringify(next))
  return true
}

export function removeMistake(email: string, questionId: string): void {
  if (typeof window === 'undefined') return
  const next = getMistakes(email).filter((m) => m.id !== questionId)
  localStorage.setItem(mistakesKey(email), JSON.stringify(next))
}

export function clearMistakes(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(mistakesKey(email), JSON.stringify([]))
}

export function hasMistake(email: string, questionId: string): boolean {
  return getMistakes(email).some((m) => m.id === questionId)
}

export function getExamAttempts(email: string): ExamAttempt[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(attemptsKey(email))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ExamAttempt[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((attempt) => ({
      ...attempt,
      questionOutcomes: Array.isArray(attempt.questionOutcomes) ? attempt.questionOutcomes : undefined,
    }))
  } catch {
    return []
  }
}

export function setExamAttempts(email: string, attempts: ExamAttempt[]): void {
  if (typeof window === 'undefined') return
  const normalized = Array.isArray(attempts)
    ? attempts
        .filter((item) => item && typeof item.id === 'string')
        .map((item) => ({
          id: String(item.id),
          year: String(item.year || 'Unknown'),
          scoreP1: Number(item.scoreP1) || 0,
          scoreP2: Number(item.scoreP2) || 0,
          totalScore: Number(item.totalScore) || 0,
          grade: Number(item.grade) || 1,
          takenAt: String(item.takenAt || new Date().toISOString()),
          questionOutcomes: Array.isArray(item.questionOutcomes)
            ? item.questionOutcomes
                .filter((outcome) => outcome && typeof outcome.questionId === 'string')
                .map((outcome) => ({
                  questionId: String(outcome.questionId),
                  paper: Number(outcome.paper) || 1,
                  index: Number(outcome.index) || 0,
                  userAnswer: outcome.userAnswer ? String(outcome.userAnswer) : undefined,
                  correctAnswer: String(outcome.correctAnswer || ''),
                  isCorrect: Boolean(outcome.isCorrect),
                }))
            : undefined,
        }))
    : []
  localStorage.setItem(attemptsKey(email), JSON.stringify(normalized))
}

export function buildUserBackup(email: string): UserDataBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    email: email.toLowerCase(),
    attempts: getExamAttempts(email),
    mistakes: getMistakes(email),
  }
}

export function addExamAttempt(email: string, attempt: Omit<ExamAttempt, 'id' | 'takenAt'>): ExamAttempt {
  const existing = getExamAttempts(email)
  const next: ExamAttempt = {
    ...attempt,
    id: `${attempt.year}_${Date.now()}`,
    takenAt: new Date().toISOString(),
  }
  localStorage.setItem(attemptsKey(email), JSON.stringify([next, ...existing]))
  return next
}

export function removeExamAttempt(email: string, attemptId: string): void {
  if (typeof window === 'undefined') return
  const next = getExamAttempts(email).filter((a) => a.id !== attemptId)
  localStorage.setItem(attemptsKey(email), JSON.stringify(next))
}

export function clearExamAttempts(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(attemptsKey(email), JSON.stringify([]))
}
