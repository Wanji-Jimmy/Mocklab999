import { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/server/http'
import { parseExamType } from '@/lib/server/exam-type'
import { findPublishedQuestions } from '@/lib/server/questions'

export async function GET(request: NextRequest) {
  const examType = parseExamType(request.nextUrl.searchParams.get('examType'))
  if (!examType) {
    return fail('examType is required: TMUA or ESAT', 400)
  }

  const yearParam = request.nextUrl.searchParams.get('year')
  const moduleOrPaper =
    request.nextUrl.searchParams.get('moduleOrPaper') || request.nextUrl.searchParams.get('module') || undefined
  const bankId = request.nextUrl.searchParams.get('bankId') || undefined
  const year = yearParam ? Number.parseInt(yearParam, 10) : undefined

  if (yearParam && !Number.isInteger(year)) {
    return fail('year must be an integer', 400)
  }

  const questions = await findPublishedQuestions({
    examType,
    year,
    moduleOrPaper,
    bankId,
  })

  return ok({
    examType,
    count: questions.length,
    items: questions.map((question) => ({
      questionId: question.id,
      bankId: question.bankId,
      moduleOrPaper: question.moduleOrPaper,
      questionNumber: question.questionNumber,
      stemLatex: question.stemLatex,
      stemImage: question.stemImage,
      options: question.options.map((option) => ({
        key: option.key,
        latex: option.latex,
        image: option.image,
      })),
      answerKey: question.answerKey,
      explanationLatex: question.explanationLatex,
      explanationImage: question.explanationImage,
      tags: (() => {
        if (!question.tags) return []
        try {
          const parsed = JSON.parse(question.tags)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })(),
      difficulty: question.difficulty,
      year: question.bank.year,
    })),
  })
}
