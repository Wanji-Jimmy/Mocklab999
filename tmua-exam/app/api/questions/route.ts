import { NextResponse, NextRequest } from 'next/server'
import { completeQuestions } from '@/lib/complete-questions'
import { getEngaaQuestionsByYear, getNsaaQuestionsByYearAndPart, getNsaaQuestionsByYearAndParts } from '@/lib/esat-questions'
import { SupportedYear, isNsaaPartAvailableForYear, isSupportedYear } from '@/lib/exam-catalog'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const exam = searchParams.get('exam') || 'tmua'
  const part = searchParams.get('part')
  const parts = searchParams.get('parts')

  if (year && !isSupportedYear(year)) {
    return NextResponse.json({ error: `Invalid year: ${year}` }, { status: 400 })
  }

  if (exam === 'tmua') {
    if (year) {
      const yearQuestions = completeQuestions
        .filter((q) => q.tags?.includes(year))
        .sort((a, b) => {
          if (a.paper !== b.paper) return a.paper - b.paper
          return a.index - b.index
        })

      return NextResponse.json(yearQuestions)
    }
    return NextResponse.json(completeQuestions)
  }

  if (exam === 'engaa') {
    if (!year) {
      return NextResponse.json({ error: 'Year is required for ENGAA' }, { status: 400 })
    }
    return NextResponse.json(getEngaaQuestionsByYear(year))
  }

  if (exam === 'nsaa') {
    if (!year) {
      return NextResponse.json({ error: 'Year is required for NSAA' }, { status: 400 })
    }
    const nsaaYear = year as SupportedYear
    if (parts) {
      const parsedParts = parts
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (
        parsedParts.length < 1 ||
        parsedParts.length > 2 ||
        parsedParts.some((item) => !isNsaaPartAvailableForYear(nsaaYear, item))
      ) {
        return NextResponse.json({ error: `Invalid NSAA parts: ${parts}` }, { status: 400 })
      }
      return NextResponse.json(getNsaaQuestionsByYearAndParts(year, parsedParts as Array<Parameters<typeof getNsaaQuestionsByYearAndPart>[1]>))
    }
    if (!part || !isNsaaPartAvailableForYear(nsaaYear, part)) {
      return NextResponse.json({ error: `Invalid NSAA part: ${part || 'missing'}` }, { status: 400 })
    }
    return NextResponse.json(getNsaaQuestionsByYearAndPart(year, part))
  }

  if (year) {
      return NextResponse.json({ error: `Invalid year: ${year}` }, { status: 400 })
  }

  return NextResponse.json({ error: `Invalid exam: ${exam}` }, { status: 400 })
}
