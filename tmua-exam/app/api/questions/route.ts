import { NextResponse, NextRequest } from 'next/server'
import { completeQuestions } from '@/lib/complete-questions'

const VALID_YEARS = new Set(['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'])

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')

  if (year) {
    if (!VALID_YEARS.has(year)) {
      return NextResponse.json({ error: `Invalid year: ${year}` }, { status: 400 })
    }

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
