import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UploadPayloadInput } from '@/lib/server/contracts'
import { requireAdmin } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAdmin(request)
    const uploadId = context.params.id

    const upload = await prisma.uploadBatch.findUnique({
      where: { id: uploadId },
      include: {
        createdBy: {
          select: { id: true, email: true },
        },
      },
    })

    if (!upload) return fail('Upload batch not found', 404)

    const payload =
      typeof upload.payload === 'string'
        ? (JSON.parse(upload.payload) as UploadPayloadInput)
        : (upload.payload as unknown as UploadPayloadInput)

    return ok({
      uploadId: upload.id,
      status: upload.status,
      examType: upload.examType,
      meta: {
        name: payload.name,
        year: payload.year,
        moduleKey: payload.moduleKey,
        totalQuestions: payload.questions?.length || 0,
      },
      sampleQuestions: (payload.questions || []).slice(0, 5).map((question) => ({
        questionNumber: question.questionNumber,
        moduleOrPaper: question.moduleOrPaper,
        answerKey: question.answerKey,
        optionCount: question.options?.length || 0,
      })),
      validationReport: upload.validationReport ? JSON.parse(upload.validationReport) : null,
      createdBy: upload.createdBy,
      createdAt: upload.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail('Failed to preview upload batch', 500)
  }
}
