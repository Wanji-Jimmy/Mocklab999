import { Suspense } from 'react'
import ExamRunner from '@/components/ExamRunner'

export default function ExamPage() {
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
      <ExamRunner year="2023" />
    </Suspense>
  )
}
