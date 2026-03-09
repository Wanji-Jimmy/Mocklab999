import { UPLOAD_STATUS } from '@/lib/server/model-constants'
import { prisma } from '@/lib/prisma'
import { UploadPayloadInput, ValidationReport } from '@/lib/server/contracts'

export async function publishUploadBatch(uploadId: string, actorUserId: string) {
  const upload = await prisma.uploadBatch.findUnique({ where: { id: uploadId } })
  if (!upload) throw new Error('Upload batch not found')

  if (upload.status !== UPLOAD_STATUS.VALIDATED) {
    throw new Error('Upload batch must be VALIDATED before publish')
  }

  const payload =
    typeof upload.payload === 'string'
      ? (JSON.parse(upload.payload) as UploadPayloadInput)
      : (upload.payload as unknown as UploadPayloadInput)

  return prisma.$transaction(async (tx) => {
    const bank = await tx.questionBank.create({
      data: {
        examType: payload.examType,
        name: payload.name,
        year: payload.year ?? null,
        moduleKey: payload.moduleKey ?? null,
        version: 1,
        isPublished: true,
        publishedAt: new Date(),
        createdById: actorUserId,
      },
    })

    for (const question of payload.questions) {
      const createdQuestion = await tx.question.create({
        data: {
          examType: payload.examType,
          bankId: bank.id,
          moduleOrPaper: question.moduleOrPaper,
          questionNumber: question.questionNumber,
          stemLatex: question.stemLatex,
          stemImage: question.stemImage ?? null,
          explanationLatex: question.explanationLatex,
          explanationImage: question.explanationImage ?? null,
          answerKey: question.answerKey,
          difficulty: question.difficulty ?? 2,
          tags: JSON.stringify(question.tags ?? []),
          isPublished: true,
        },
      })

      if (question.options.length > 0) {
        for (let idx = 0; idx < question.options.length; idx += 1) {
          const option = question.options[idx]
          await tx.option.create({
            data: {
              questionId: createdQuestion.id,
              key: option.key,
              latex: option.latex,
              image: option.image ?? null,
              order: idx,
            },
          })
        }
      }
    }

    const updatedUpload = await tx.uploadBatch.update({
      where: { id: upload.id },
      data: {
        status: UPLOAD_STATUS.PUBLISHED,
        publishedAt: new Date(),
        publishedBankId: bank.id,
      },
    })

    return {
      upload: updatedUpload,
      bank,
    }
  })
}

export async function rollbackUploadBatch(uploadId: string) {
  const upload = await prisma.uploadBatch.findUnique({ where: { id: uploadId } })
  if (!upload) throw new Error('Upload batch not found')
  if (!upload.publishedBankId) throw new Error('Upload batch has no published bank')

  return prisma.$transaction(async (tx) => {
    await tx.questionBank.update({
      where: { id: upload.publishedBankId! },
      data: {
        isPublished: false,
      },
    })

    return tx.uploadBatch.update({
      where: { id: upload.id },
      data: {
        status: UPLOAD_STATUS.ROLLED_BACK,
        rolledBackAt: new Date(),
      },
    })
  })
}

export function validationReportToJson(report: ValidationReport): string {
  return JSON.stringify(report)
}

export function payloadToJson(payload: UploadPayloadInput): string {
  return JSON.stringify(payload)
}
