import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ExamRunner from '@/components/ExamRunner'
import { SupportedYear, isNsaaPartAvailableForYear, isSupportedYear } from '@/lib/exam-catalog'

export default function NsaaExamComboPage({
  params,
  searchParams,
}: {
  params: { year: string }
  searchParams: { parts?: string }
}) {
  if (!isSupportedYear(params.year)) {
    notFound()
  }
  const nsaaYear = params.year as SupportedYear

  const parsedParts = String(searchParams.parts || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (
    parsedParts.length < 1 ||
    parsedParts.length > 2 ||
    parsedParts.some((item) => !isNsaaPartAvailableForYear(nsaaYear, item))
  ) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="exam-loading-shell">
          <div className="exam-loading-core">
            <span className="exam-loading-dot" />
            Preparing your NSAA paper...
          </div>
        </div>
      }
    >
      <ExamRunner year={params.year} exam="nsaa" nsaaParts={parsedParts as Parameters<typeof ExamRunner>[0]['nsaaParts']} />
    </Suspense>
  )
}
