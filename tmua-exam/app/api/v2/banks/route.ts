import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExamType } from '@/lib/server/exam-type'
import { fail, ok } from '@/lib/server/http'

export async function GET(request: NextRequest) {
  const examType = parseExamType(request.nextUrl.searchParams.get('examType'))
  if (!examType) return fail('examType is required: TMUA or ESAT', 400)

  const banks = await prisma.questionBank.findMany({
    where: {
      examType,
      isPublished: true,
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
    take: 200,
  })

  return ok({
    examType,
    count: banks.length,
    items: banks.map((bank) => ({
      bankId: bank.id,
      examType: bank.examType,
      name: bank.name,
      year: bank.year,
      moduleKey: bank.moduleKey,
      version: bank.version,
      questionCount: bank._count.questions,
      publishedAt: bank.publishedAt,
    })),
  })
}
