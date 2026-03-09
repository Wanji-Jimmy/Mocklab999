import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ExamRunner from '@/components/ExamRunner'
import { isSupportedYear } from '@/lib/exam-catalog'

export default function EngaaYearExamPage({ params }: { params: { year: string } }) {
  if (!isSupportedYear(params.year)) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="exam-loading-shell">
          <div className="exam-loading-core">
            <span className="exam-loading-dot" />
            Preparing your ENGAA paper...
          </div>
        </div>
      }
    >
      <ExamRunner year={params.year} exam="engaa" />
    </Suspense>
  )
}
