import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
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

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const id = context.params.id

    const existing = await prisma.examSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) return fail('Session not found', 404)

    const session = await prisma.examSession.update({
      where: { id },
      data: {
        state: typeof body?.state === 'string' ? body.state : undefined,
        progress: body?.progress ? JSON.stringify(body.progress) : undefined,
        submittedAt: body?.submitted ? new Date() : undefined,
      },
    })

    return ok({
      item: {
        ...session,
        progress: parseMaybeJson(session.progress),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    return fail('Failed to update session', 500)
  }
}
