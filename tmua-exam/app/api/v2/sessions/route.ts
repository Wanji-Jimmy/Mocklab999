import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExamType } from '@/lib/server/exam-type'
import { requireUser } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'

function parseMaybeJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const examType = parseExamType(request.nextUrl.searchParams.get('examType'))

    const sessions = await prisma.examSession.findMany({
      where: {
        userId: user.id,
        ...(examType ? { examType } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return ok({
      items: sessions.map((session) => ({
        ...session,
        progress: parseMaybeJson(session.progress),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to load sessions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const examType = parseExamType(body?.examType)

    if (!examType) return fail('examType is required: TMUA or ESAT', 400)

    const session = await prisma.examSession.create({
      data: {
        userId: user.id,
        examType,
        bankId: body?.bankId ? String(body.bankId) : null,
        state: String(body?.state || 'WELCOME'),
        progress: body?.progress ? JSON.stringify(body.progress) : null,
      },
    })

    return ok({
      sessionId: session.id,
      examType: session.examType,
      state: session.state,
      startedAt: session.startedAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to create session', 500)
  }
}
