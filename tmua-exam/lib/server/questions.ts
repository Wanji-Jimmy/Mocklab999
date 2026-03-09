import { prisma } from '@/lib/prisma'
import { Question as LegacyQuestion } from '@/lib/types'
import { ExamTypeValue } from '@/lib/server/model-constants'

function parsePaperIndex(moduleOrPaper: string, fallback: number): { paper: number; index: number } {
  const simpleMatch = moduleOrPaper.match(/^P(\d+)$/i)
  if (simpleMatch) {
    return {
      paper: Number.parseInt(simpleMatch[1], 10) || 1,
      index: Math.max(0, fallback - 1),
    }
  }

  const match = moduleOrPaper.match(/^P(\d+)-Q(\d+)$/i)
  if (!match) {
    return {
      paper: 1,
      index: Math.max(0, fallback - 1),
    }
  }

  return {
    paper: Number.parseInt(match[1], 10) || 1,
    index: (Number.parseInt(match[2], 10) || fallback) - 1,
  }
}

export async function findPublishedQuestions(params: {
  examType: ExamTypeValue
  year?: number
  moduleOrPaper?: string
  bankId?: string
}) {
  const where: Record<string, unknown> = {
    examType: params.examType,
    isPublished: true,
  }

  if (params.moduleOrPaper) {
    where.moduleOrPaper = params.moduleOrPaper
  }

  if (params.bankId) {
    where.bankId = params.bankId
  } else {
    const bankWhere: Record<string, unknown> = {
      examType: params.examType,
      isPublished: true,
    }
    if (typeof params.year === 'number') {
      bankWhere.year = params.year
    }
    where.bank = bankWhere
  }

  return prisma.question.findMany({
    where,
    orderBy: [{ moduleOrPaper: 'asc' }, { questionNumber: 'asc' }],
    include: {
      options: {
        orderBy: [{ order: 'asc' }, { key: 'asc' }],
      },
      bank: true,
    },
  })
}

export function mapDbQuestionToLegacyTMUA(question: {
  id: string
  moduleOrPaper: string
  questionNumber: number
  stemLatex: string
  stemImage: string | null
  explanationLatex: string
  explanationImage: string | null
  tags: string | null
  difficulty: number
  answerKey: string
  options: Array<{ key: string; latex: string; image: string | null }>
  bank?: { year: number | null } | null
}): LegacyQuestion {
  const { paper, index } = parsePaperIndex(question.moduleOrPaper, question.questionNumber)
  let parsedTags: string[] = []
  if (question.tags) {
    try {
      const decoded = JSON.parse(question.tags)
      if (Array.isArray(decoded)) parsedTags = decoded.map((tag) => String(tag))
    } catch {
      parsedTags = []
    }
  }
  const tags =
    parsedTags.length > 0
      ? parsedTags
      : question.bank?.year
        ? [String(question.bank.year), `Paper${paper}`]
        : [`Paper${paper}`]

  return {
    id: question.id,
    paper,
    index,
    stemLatex: question.stemLatex,
    stemImage: question.stemImage || undefined,
    options: question.options.map((option) => ({
      key: option.key,
      latex: option.latex,
      image: option.image || undefined,
    })),
    answerKey: question.answerKey,
    explanationLatex: question.explanationLatex,
    explanationImage: question.explanationImage || undefined,
    tags,
    difficulty: question.difficulty,
  }
}
