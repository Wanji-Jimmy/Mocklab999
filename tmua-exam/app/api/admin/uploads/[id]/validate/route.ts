import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UploadPayloadInput } from '@/lib/server/contracts'
import { requireAdmin } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'
import { UPLOAD_STATUS } from '@/lib/server/model-constants'
import { validateUploadPayload } from '@/lib/server/upload-validation'
import { validationReportToJson } from '@/lib/server/uploads'

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAdmin(request)
    const uploadId = context.params.id

    const upload = await prisma.uploadBatch.findUnique({ where: { id: uploadId } })
    if (!upload) return fail('Upload batch not found', 404)

    const payload =
      typeof upload.payload === 'string'
        ? (JSON.parse(upload.payload) as UploadPayloadInput)
        : (upload.payload as unknown as UploadPayloadInput)
    const report = validateUploadPayload(payload)

    const updated = await prisma.uploadBatch.update({
      where: { id: uploadId },
      data: {
        validationReport: validationReportToJson(report),
        validatedAt: new Date(),
        status: report.valid ? UPLOAD_STATUS.VALIDATED : UPLOAD_STATUS.FAILED,
      },
    })

    return ok({
      uploadId: updated.id,
      status: updated.status,
      report,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail('Failed to validate upload batch', 500)
  }
}
