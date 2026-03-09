import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ExamRunner from '@/components/ExamRunner'

const VALID_YEARS = new Set(['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'])

export default function YearExamPage({ params }: { params: { year: string } }) {
  if (!VALID_YEARS.has(params.year)) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="exam-loading-shell">
          <div className="exam-loading-core">
            <span className="exam-loading-dot" />
            Preparing your TMUA paper...
          </div>
        </div>
      }
    >
      <ExamRunner year={params.year} />
    </Suspense>
  )
}
