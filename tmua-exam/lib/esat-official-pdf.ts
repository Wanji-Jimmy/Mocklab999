import { Question } from '@/lib/types'

const OFFICIAL_PDF_BASE = 'https://esat-tmua.ac.uk/esat-preparation-materials/pdf'
const PLACEHOLDER_MARKER = 'diagram/text unavailable'
const SUPPORTED_EXAMS = new Set(['ENGAA', 'NSAA'])

function getQuestionYearTag(question: Question): string | null {
  const tags = question.tags || []
  const yearTag = tags.find((tag) => /^\d{4}$/.test(tag))
  return yearTag || null
}

function getQuestionExamTag(question: Question): 'ENGAA' | 'NSAA' | null {
  const tags = question.tags || []
  if (tags.includes('ENGAA')) return 'ENGAA'
  if (tags.includes('NSAA')) return 'NSAA'
  return null
}

export function hasDiagramPlaceholderOption(question: Question): boolean {
  return (question.options || []).some((option) => String(option.latex || '').includes(PLACEHOLDER_MARKER))
}

export function isDiagramPlaceholderOptionText(value: string): boolean {
  return String(value || '').includes(PLACEHOLDER_MARKER)
}

export function getOfficialQuestionPdfUrl(exam: string, year: string): string | null {
  const normalizedExam = String(exam || '').trim().toUpperCase()
  const normalizedYear = String(year || '').trim()
  if (!SUPPORTED_EXAMS.has(normalizedExam)) return null
  if (!/^\d{4}$/.test(normalizedYear)) return null
  return `${OFFICIAL_PDF_BASE}/${normalizedExam}_${normalizedYear}_S1_QuestionPaper.pdf`
}

export function getOfficialAnswerKeyPdfUrl(exam: string, year: string): string | null {
  const normalizedExam = String(exam || '').trim().toUpperCase()
  const normalizedYear = String(year || '').trim()
  if (!SUPPORTED_EXAMS.has(normalizedExam)) return null
  if (!/^\d{4}$/.test(normalizedYear)) return null
  return `${OFFICIAL_PDF_BASE}/${normalizedExam}_${normalizedYear}_S1_AnswerKey.pdf`
}

export function getOfficialPdfUrl(question: Question): string | null {
  const examTag = getQuestionExamTag(question)
  const year = getQuestionYearTag(question)
  if (!examTag || !year) return null
  return getOfficialQuestionPdfUrl(examTag, year)
}
