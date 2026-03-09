import { NextResponse, NextRequest } from 'next/server'
import { completeQuestions } from '@/lib/complete-questions'
import { SupportedYear, isNsaaPartAvailableForYear, isSupportedYear, NsaaPartKey } from '@/lib/exam-catalog'
import { getEngaaQuestionsByYear, getNsaaQuestionsByYearAndPart, getNsaaQuestionsByYearAndParts } from '@/lib/esat-questions'
import { EXAM_TYPES } from '@/lib/server/model-constants'
import { findPublishedQuestions, mapDbQuestionToLegacyTMUA } from '@/lib/server/questions'

const VALID_YEARS = new Set(['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'])

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const exam = String(searchParams.get('exam') || 'tmua').toLowerCase()

  if (exam === 'engaa') {
    if (!year || !isSupportedYear(year)) {
      return NextResponse.json({ error: `Invalid year: ${year || 'missing'}` }, { status: 400 })
    }
    return NextResponse.json(getEngaaQuestionsByYear(year as SupportedYear))
  }

  if (exam === 'nsaa') {
    if (!year || !isSupportedYear(year)) {
      return NextResponse.json({ error: `Invalid year: ${year || 'missing'}` }, { status: 400 })
    }
    const nsaaYear = year as SupportedYear
    const part = String(searchParams.get('part') || '').trim()
    const parts = String(searchParams.get('parts') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, idx, arr) => arr.indexOf(item) === idx)

    if (parts.length > 0) {
      if (parts.length > 2 || parts.some((p) => !isNsaaPartAvailableForYear(nsaaYear, p))) {
        return NextResponse.json({ error: 'Invalid NSAA parts' }, { status: 400 })
      }
      return NextResponse.json(getNsaaQuestionsByYearAndParts(nsaaYear, parts as NsaaPartKey[]))
    }

    if (!part || !isNsaaPartAvailableForYear(nsaaYear, part)) {
      return NextResponse.json({ error: 'Invalid NSAA part' }, { status: 400 })
    }
    return NextResponse.json(getNsaaQuestionsByYearAndPart(nsaaYear, part as NsaaPartKey))
  }

  const yearAsInt = year ? Number.parseInt(year, 10) : undefined

  if (year) {
    if (!VALID_YEARS.has(year)) {
      return NextResponse.json({ error: `Invalid year: ${year}` }, { status: 400 })
    }

    const dbQuestions = await findPublishedQuestions({
      examType: EXAM_TYPES.TMUA,
      year: yearAsInt,
    })

    if (dbQuestions.length > 0) {
      return NextResponse.json(dbQuestions.map(mapDbQuestionToLegacyTMUA))
    }

    const yearQuestions = completeQuestions
      .filter((q) => q.tags?.includes(year))
      .sort((a, b) => {
        if (a.paper !== b.paper) return a.paper - b.paper
        return a.index - b.index
      })

    return NextResponse.json(yearQuestions)
  }

  const dbQuestions = await findPublishedQuestions({
    examType: EXAM_TYPES.TMUA,
  })

  if (dbQuestions.length > 0) {
    return NextResponse.json(dbQuestions.map(mapDbQuestionToLegacyTMUA))
  }

  return NextResponse.json(completeQuestions)
}
