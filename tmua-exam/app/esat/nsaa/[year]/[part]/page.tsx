import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ExamRunner from '@/components/ExamRunner'
import { SupportedYear, isNsaaPartAvailableForYear, isSupportedYear } from '@/lib/exam-catalog'

export default function NsaaPartExamPage({ params }: { params: { year: string; part: string } }) {
  if (!isSupportedYear(params.year)) {
    notFound()
  }
  const nsaaYear = params.year as SupportedYear
  if (!isNsaaPartAvailableForYear(nsaaYear, params.part)) {
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
      <ExamRunner year={params.year} exam="nsaa" nsaaParts={[params.part]} />
    </Suspense>
  )
}
