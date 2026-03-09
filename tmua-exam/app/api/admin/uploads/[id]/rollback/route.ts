import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/server/guards'
import { fail, ok } from '@/lib/server/http'
import { rollbackUploadBatch } from '@/lib/server/uploads'

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAdmin(request)
    const uploadId = context.params.id

    const upload = await rollbackUploadBatch(uploadId)

    return ok({
      uploadId: upload.id,
      status: upload.status,
      rolledBackAt: upload.rolledBackAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Unauthorized', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Forbidden', 403)
    return fail(error instanceof Error ? error.message : 'Failed to rollback upload batch', 400)
  }
}
