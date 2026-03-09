import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExamType } from '@/lib/server/exam-type'
import { requireUser } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const examType = parseExamType(request.nextUrl.searchParams.get('examType'))

    const mistakes = await prisma.mistake.findMany({
      where: {
        userId: user.id,
        ...(examType ? { examType } : {}),
      },
      orderBy: { addedAt: 'desc' },
      include: {
        question: {
          include: {
            bank: true,
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      take: 200,
    })

    return ok({
      items: mistakes.map((mistake) => ({
        ...mistake,
        year: mistake.question.bank?.year ? String(mistake.question.bank.year) : 'Unknown',
        paper: (() => {
          const match = String(mistake.question.moduleOrPaper || '').match(/^P(\d+)/i)
          return match ? Number.parseInt(match[1], 10) || 1 : 1
        })(),
        index: Math.max(0, mistake.question.questionNumber - 1),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to load mistakes', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()

    const questionId = String(body?.questionId || '')
    const examType = parseExamType(body?.examType)
    if (!questionId) return fail('questionId is required', 400)
    if (!examType) return fail('examType is required: TMUA or ESAT', 400)

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) return fail('Question not found', 404)
    if (question.examType !== examType) return fail('examType does not match question', 400)

    const mistake = await prisma.mistake.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId,
        },
      },
      update: {
        examType,
        reasonTag: body?.reasonTag ? String(body.reasonTag) : null,
        lastReviewedAt: null,
      },
      create: {
        userId: user.id,
        questionId,
        examType,
        reasonTag: body?.reasonTag ? String(body.reasonTag) : null,
      },
    })

    return ok({ item: mistake })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to add mistake', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const questionId = String(body?.questionId || '')

    if (!questionId) return fail('questionId is required', 400)

    await prisma.mistake.deleteMany({
      where: {
        userId: user.id,
        questionId,
      },
    })

    return ok({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to remove mistake', 500)
  }
}
