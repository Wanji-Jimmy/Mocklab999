import { ExamAttempt, MistakeItem } from '@/lib/storage'
import { Question } from '@/lib/types'

export interface AuthUser {
  id: string
  email: string
  isAdmin: boolean
  createdAt?: string
}

interface AuthMeResponse {
  user: AuthUser | null
}

interface AuthMutationResponse {
  user?: AuthUser
  error?: string
}

export interface SessionSummary {
  id: string
  examType: 'TMUA' | 'ESAT'
  bankId: string | null
  state: string
  submittedAt: string | null
  updatedAt: string
  progress?: Record<string, unknown> | null
}

export interface CreateSessionInput {
  examType: 'TMUA' | 'ESAT'
  bankId?: string | null
  state?: string
  progress?: Record<string, unknown>
}

export interface UpdateSessionInput {
  state?: string
  progress?: Record<string, unknown>
  submitted?: boolean
}

export interface SubmitAttemptInput {
  examType: 'TMUA' | 'ESAT'
  bankId: string
  answers: Record<string, string>
  flags?: Record<string, Record<string, boolean>>
}

export interface SubmitAttemptResponse {
  attemptId: string
  examType: string
  scoreTotal: number
  scoreBreakdown?: Record<string, unknown>
  grade?: number | null
  totalQuestions: number
  questionOutcomes: Array<{
    questionId: string
    moduleOrPaper: string
    questionNumber: number
    userAnswer?: string
    correctAnswer: string
    isCorrect: boolean
  }>
  createdAt: string
}

export interface UploadBatchSummary {
  id: string
  examType: string
  status: string
  createdAt: string
  validatedAt?: string | null
  publishedAt?: string | null
  rolledBackAt?: string | null
  createdBy?: { id: string; email: string }
}

export interface QuestionBankSummary {
  bankId: string
  examType: 'TMUA' | 'ESAT'
  name: string
  year?: number | null
  moduleKey?: string | null
  version: number
  questionCount: number
  publishedAt?: string | null
}

interface UploadMutationResponse {
  uploadId?: string
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

function mapV2QuestionItemToQuestion(item: Record<string, unknown>): Question {
  const moduleOrPaper = String(item.moduleOrPaper || '')
  const paperMatch = moduleOrPaper.match(/^P(\d+)/i)
  const paper = paperMatch ? Number.parseInt(paperMatch[1], 10) || 1 : 1
  const questionNumber = Number(item.questionNumber || 1)
  return {
    id: String(item.questionId || item.id || ''),
    paper,
    index: Math.max(0, questionNumber - 1),
    stemLatex: String(item.stemLatex || ''),
    stemImage: item.stemImage ? String(item.stemImage) : undefined,
    options: asArray(item.options).map((option) => {
      const row = asRecord(option)
      return {
        key: String(row.key || '').toUpperCase(),
        latex: String(row.latex || ''),
        image: row.image ? String(row.image) : undefined,
      }
    }),
    answerKey: String(item.answerKey || '').toUpperCase(),
    explanationLatex: String(item.explanationLatex || ''),
    explanationImage: item.explanationImage ? String(item.explanationImage) : undefined,
    tags: asArray(item.tags).map((tag) => String(tag)),
    difficulty: Number(item.difficulty || 2),
  }
}

export async function fetchAuthMe(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (!response.ok) return null
  const payload = (await response.json()) as AuthMeResponse
  return payload.user || null
}

async function authPost(path: '/api/auth/login' | '/api/auth/register', email: string, password: string): Promise<AuthUser> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const payload = (await response.json().catch(() => ({}))) as AuthMutationResponse
  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`)
  }
  if (!payload.user) {
    throw new Error('Missing user payload')
  }
  return payload.user
}

export async function loginWithPasswordApi(email: string, password: string): Promise<AuthUser> {
  return authPost('/api/auth/login', email, password)
}

export async function registerWithPasswordApi(email: string, password: string): Promise<AuthUser> {
  return authPost('/api/auth/register', email, password)
}

export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined)
}

export async function fetchAttemptsV2(examType?: 'TMUA' | 'ESAT'): Promise<ExamAttempt[]> {
  const search = new URLSearchParams()
  if (examType) search.set('examType', examType)
  const response = await fetch(`/api/v2/attempts${search.toString() ? `?${search.toString()}` : ''}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as { items?: unknown[] }
  return asArray(payload.items).map((item) => {
    const row = asRecord(item)
    const apiExamType = String(row.examType || 'TMUA').toUpperCase()
    const firstQuestionId = String(asRecord(asArray(row.questionOutcomes)[0]).questionId || '')
    const normalizedExam: ExamAttempt['exam'] =
      apiExamType !== 'ESAT' ? 'tmua' : firstQuestionId.startsWith('NSAA-') ? 'nsaa' : 'engaa'
    return {
      id: String(row.id || ''),
      year: String(row.year || 'Unknown'),
      exam: normalizedExam,
      scoreP1: Number(row.scoreP1 || 0),
      scoreP2: Number(row.scoreP2 || 0),
      totalScore: Number(row.totalScore || 0),
      grade: Number(row.grade || 1),
      takenAt: String(row.takenAt || row.createdAt || new Date().toISOString()),
      questionOutcomes: asArray(row.questionOutcomes).map((outcome) => {
        const o = asRecord(outcome)
        return {
          questionId: String(o.questionId || ''),
          paper: Number(o.paper || 1),
          index: Number(o.index || 0),
          userAnswer: o.userAnswer ? String(o.userAnswer) : undefined,
          correctAnswer: String(o.correctAnswer || ''),
          isCorrect: Boolean(o.isCorrect),
        }
      }),
      parts: asArray(row.parts).map((part) => String(part)) as ExamAttempt['parts'],
    }
  })
}

export async function removeAttemptV2(attemptId: string): Promise<void> {
  const response = await fetch('/api/v2/attempts', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ attemptId }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

export async function fetchMistakesV2(examType?: 'TMUA' | 'ESAT'): Promise<MistakeItem[]> {
  const search = new URLSearchParams()
  if (examType) search.set('examType', examType)
  const response = await fetch(`/api/v2/mistakes${search.toString() ? `?${search.toString()}` : ''}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as { items?: unknown[] }
  return asArray(payload.items).map((item) => {
    const row = asRecord(item)
    const questionId = String(row.questionId || row.id || '')
    const apiExamType = String(row.examType || 'TMUA').toUpperCase()
    const normalizedExam: MistakeItem['exam'] =
      apiExamType !== 'ESAT' ? 'tmua' : questionId.startsWith('NSAA-') ? 'nsaa' : 'engaa'
    return {
      id: questionId,
      year: String(row.year || 'Unknown'),
      exam: normalizedExam,
      part: row.part ? (String(row.part) as MistakeItem['part']) : undefined,
      paper: Number(row.paper || 1),
      index: Number(row.index || 0),
      addedAt: String(row.addedAt || new Date().toISOString()),
    }
  })
}

export async function removeMistakeV2(questionId: string): Promise<void> {
  const response = await fetch('/api/v2/mistakes', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ questionId }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

export async function addMistakeV2(examType: 'TMUA' | 'ESAT', questionId: string): Promise<void> {
  const response = await fetch('/api/v2/mistakes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ examType, questionId }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

export async function fetchSessionsV2(examType: 'TMUA' | 'ESAT'): Promise<SessionSummary[]> {
  const response = await fetch(`/api/v2/sessions?examType=${encodeURIComponent(examType)}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { items?: unknown[] }
  return asArray(payload.items).map((item) => {
    const row = asRecord(item)
    const progressValue = row.progress
    return {
      id: String(row.id || ''),
      examType: String(row.examType || 'TMUA') as 'TMUA' | 'ESAT',
      bankId: row.bankId ? String(row.bankId) : null,
      state: String(row.state || 'WELCOME'),
      submittedAt: row.submittedAt ? String(row.submittedAt) : null,
      updatedAt: String(row.updatedAt || new Date().toISOString()),
      progress:
        progressValue && typeof progressValue === 'object'
          ? (progressValue as Record<string, unknown>)
          : null,
    }
  })
}

export async function fetchQuestionsV2(
  examType: 'TMUA' | 'ESAT',
  params: { year?: string; moduleOrPaper?: string; bankId?: string } = {},
): Promise<{ bankId: string | null; items: Question[] }> {
  const search = new URLSearchParams({ examType })
  if (params.year) search.set('year', params.year)
  if (params.moduleOrPaper) search.set('moduleOrPaper', params.moduleOrPaper)
  if (params.bankId) search.set('bankId', params.bankId)

  const response = await fetch(`/api/v2/questions?${search.toString()}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as { bankId?: string; items?: unknown[] }
  const items = asArray(payload.items).map((item) => mapV2QuestionItemToQuestion(asRecord(item)))
  items.sort((a, b) => (a.paper !== b.paper ? a.paper - b.paper : a.index - b.index))

  return {
    bankId: payload.bankId ? String(payload.bankId) : null,
    items,
  }
}

export async function fetchQuestionBanksV2(examType: 'TMUA' | 'ESAT'): Promise<QuestionBankSummary[]> {
  const response = await fetch(`/api/v2/banks?examType=${encodeURIComponent(examType)}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { items?: unknown[] }
  return asArray(payload.items).map((item) => {
    const row = asRecord(item)
    return {
      bankId: String(row.bankId || ''),
      examType: String(row.examType || 'TMUA') as 'TMUA' | 'ESAT',
      name: String(row.name || ''),
      year: typeof row.year === 'number' ? row.year : null,
      moduleKey: row.moduleKey ? String(row.moduleKey) : null,
      version: Number(row.version || 1),
      questionCount: Number(row.questionCount || 0),
      publishedAt: row.publishedAt ? String(row.publishedAt) : null,
    }
  })
}

export async function createSessionV2(input: CreateSessionInput): Promise<string> {
  const response = await fetch('/api/v2/sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { sessionId?: string }
  return String(payload.sessionId || '')
}

export async function updateSessionV2(sessionId: string, input: UpdateSessionInput): Promise<void> {
  const response = await fetch(`/api/v2/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

export async function submitAttemptV2(input: SubmitAttemptInput): Promise<SubmitAttemptResponse> {
  const response = await fetch('/api/v2/attempts', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return (await response.json()) as SubmitAttemptResponse
}

export async function fetchUploadBatches(examType?: 'TMUA' | 'ESAT'): Promise<UploadBatchSummary[]> {
  const query = examType ? `?examType=${encodeURIComponent(examType)}` : ''
  const response = await fetch(`/api/admin/uploads${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { items?: unknown[] }
  return asArray(payload.items).map((item) => {
    const row = asRecord(item)
    return {
      id: String(row.id || ''),
      examType: String(row.examType || ''),
      status: String(row.status || ''),
      createdAt: String(row.createdAt || ''),
      validatedAt: row.validatedAt ? String(row.validatedAt) : null,
      publishedAt: row.publishedAt ? String(row.publishedAt) : null,
      rolledBackAt: row.rolledBackAt ? String(row.rolledBackAt) : null,
      createdBy:
        row.createdBy && typeof row.createdBy === 'object'
          ? ({
              id: String((row.createdBy as Record<string, unknown>).id || ''),
              email: String((row.createdBy as Record<string, unknown>).email || ''),
            } as { id: string; email: string })
          : undefined,
    }
  })
}

export async function createUploadBatch(payload: Record<string, unknown>): Promise<string> {
  const response = await fetch('/api/admin/uploads', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as UploadMutationResponse
  return String(data.uploadId || '')
}

export async function validateUploadBatch(uploadId: string): Promise<void> {
  const response = await fetch(`/api/admin/uploads/${encodeURIComponent(uploadId)}/validate`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function previewUploadBatch(uploadId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/admin/uploads/${encodeURIComponent(uploadId)}/preview`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as Record<string, unknown>
}

export async function publishUploadBatch(uploadId: string): Promise<void> {
  const response = await fetch(`/api/admin/uploads/${encodeURIComponent(uploadId)}/publish`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

export async function rollbackUploadBatch(uploadId: string): Promise<void> {
  const response = await fetch(`/api/admin/uploads/${encodeURIComponent(uploadId)}/rollback`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}
