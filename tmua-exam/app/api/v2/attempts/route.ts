import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExamType } from '@/lib/server/exam-type'
import { requireUser } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'
import { EXAM_TYPES } from '@/lib/server/model-constants'
import { evaluateSubmission } from '@/lib/server/scoring'
import { calculateGrade } from '@/lib/utils'

function normalizeAnswerMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const entries = Object.entries(value as Record<string, unknown>)
  const result: Record<string, string> = {}
  for (const [key, answer] of entries) {
    if (!key) continue
    result[key] = String(answer || '').trim().toUpperCase()
  }
  return result
}

function parseMaybeJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parsePaperFromModule(moduleOrPaper: string): number {
  const match = String(moduleOrPaper || '').match(/^P(\d+)/i)
  return match ? Number.parseInt(match[1], 10) || 1 : 1
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

function getCorrectFromBreakdown(value: unknown): number {
  const row = asRecord(value)
  const correct = row.correct
  return typeof correct === 'number' ? correct : 0
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const examType = parseExamType(request.nextUrl.searchParams.get('examType'))

    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId: user.id,
        ...(examType ? { examType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        bank: true,
      },
    })

    return ok({
      items: attempts.map((attempt) => ({
        id: attempt.id,
        year: attempt.bank?.year ? String(attempt.bank.year) : 'Unknown',
        scoreP1: getCorrectFromBreakdown(asRecord(parseMaybeJson(attempt.scoreBreakdown))['P1']),
        scoreP2: getCorrectFromBreakdown(asRecord(parseMaybeJson(attempt.scoreBreakdown))['P2']),
        totalScore: attempt.scoreTotal,
        grade: typeof attempt.grade === 'number' ? attempt.grade : calculateGrade(attempt.scoreTotal),
        takenAt: attempt.createdAt,
        questionOutcomes: (() => {
          const outcomesRaw = parseMaybeJson(attempt.questionOutcomes)
          if (!Array.isArray(outcomesRaw)) return []
          return outcomesRaw.map((outcome) => {
            const row = outcome as Record<string, unknown>
            const moduleOrPaper = String(row.moduleOrPaper || '')
            const questionNumber = Number(row.questionNumber || 1)
            return {
              questionId: String(row.questionId || ''),
              paper: parsePaperFromModule(moduleOrPaper),
              index: Math.max(0, questionNumber - 1),
              userAnswer: row.userAnswer ? String(row.userAnswer) : undefined,
              correctAnswer: String(row.correctAnswer || ''),
              isCorrect: Boolean(row.isCorrect),
            }
          })
        })(),
        examType: attempt.examType,
        bankId: attempt.bankId,
        scoreBreakdown: parseMaybeJson(attempt.scoreBreakdown),
        answers: parseMaybeJson(attempt.answers) || {},
        flags: parseMaybeJson(attempt.flags),
        createdAt: attempt.createdAt,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to load attempts', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const examType = parseExamType(body?.examType)
    const bankId = String(body?.bankId || '')
    const answers = normalizeAnswerMap(body?.answers)

    if (!examType) return fail('examType is required: TMUA or ESAT', 400)
    if (!bankId) return fail('bankId is required', 400)

    const questions = await prisma.question.findMany({
      where: {
        examType,
        bankId,
      },
      select: {
        id: true,
        moduleOrPaper: true,
        questionNumber: true,
        answerKey: true,
      },
      orderBy: [{ moduleOrPaper: 'asc' }, { questionNumber: 'asc' }],
    })

    if (questions.length === 0) return fail('No questions found for this bank', 404)

    const score = evaluateSubmission(examType, questions, answers)

    const attempt = await prisma.examAttempt.create({
      data: {
        userId: user.id,
        examType,
        bankId,
        scoreTotal: score.totalCorrect,
        scoreBreakdown: JSON.stringify(score.scoreBreakdown),
        grade: examType === EXAM_TYPES.TMUA ? calculateGrade(score.totalCorrect) : null,
        answers: JSON.stringify(answers),
        flags: body?.flags ? JSON.stringify(body.flags) : null,
        questionOutcomes: JSON.stringify(score.outcomes),
      },
    })

    return ok({
      attemptId: attempt.id,
      examType: attempt.examType,
      scoreTotal: attempt.scoreTotal,
      scoreBreakdown: score.scoreBreakdown,
      grade: attempt.grade,
      totalQuestions: score.totalQuestions,
      questionOutcomes: score.outcomes,
      createdAt: attempt.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to submit attempt', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const attemptId = String(body?.attemptId || '')

    if (!attemptId) return fail('attemptId is required', 400)

    await prisma.examAttempt.deleteMany({
      where: {
        id: attemptId,
        userId: user.id,
      },
    })

    return ok({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to delete attempt', 500)
  }
}
