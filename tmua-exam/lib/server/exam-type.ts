import { EXAM_TYPES, ExamTypeValue } from '@/lib/server/model-constants'

export function parseExamType(value: string | null | undefined): ExamTypeValue | null {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === EXAM_TYPES.TMUA) return EXAM_TYPES.TMUA
  if (normalized === EXAM_TYPES.ESAT) return EXAM_TYPES.ESAT
  return null
}
