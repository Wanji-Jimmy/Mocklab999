import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'
import { publishUploadBatch } from '@/lib/server/uploads'

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(request)
    const uploadId = context.params.id

    const published = await publishUploadBatch(uploadId, admin.id)

    return ok({
      uploadId: published.upload.id,
      status: published.upload.status,
      publishedAt: published.upload.publishedAt,
      bank: {
        bankId: published.bank.id,
        examType: published.bank.examType,
        name: published.bank.name,
        year: published.bank.year,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail(error instanceof Error ? error.message : 'Failed to publish upload batch', 400)
  }
}
