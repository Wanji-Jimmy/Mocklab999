import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UploadPayloadInput } from '@/lib/server/contracts'
import { parseExamType } from '@/lib/server/exam-type'
import { requireAdmin } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'
import { UPLOAD_STATUS } from '@/lib/server/model-constants'
import { payloadToJson } from '@/lib/server/uploads'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const examType = parseExamType(request.nextUrl.searchParams.get('examType'))
    const statusParam = request.nextUrl.searchParams.get('status')
    const status = statusParam && (Object.values(UPLOAD_STATUS) as string[]).includes(statusParam)
      ? statusParam
      : undefined

    const uploads = await prisma.uploadBatch.findMany({
      where: {
        ...(examType ? { examType } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        createdBy: {
          select: { id: true, email: true },
        },
      },
    })

    return ok({
      items: uploads.map((upload) => ({
        ...upload,
        validationReport: upload.validationReport ? JSON.parse(upload.validationReport) : null,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail('Failed to load upload batches', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    const body = (await request.json()) as UploadPayloadInput
    const examType = parseExamType(body?.examType)

    if (!examType) return fail('examType is required: TMUA or ESAT', 400)
    if (!body.name || !String(body.name).trim()) return fail('name is required', 400)
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return fail('questions must be a non-empty array', 400)
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        examType,
        status: UPLOAD_STATUS.UPLOADED,
        payload: payloadToJson({ ...body, examType }),
        fileName: `${examType.toLowerCase()}_${Date.now()}.json`,
        createdById: admin.id,
      },
    })

    return ok({
      uploadId: batch.id,
      status: batch.status,
      examType: batch.examType,
      createdAt: batch.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail('Failed to create upload batch', 500)
  }
}
