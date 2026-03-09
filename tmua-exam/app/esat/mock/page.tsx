'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ExamRunner from '@/components/ExamRunner'
import { ExamTrack, isNsaaPartAvailableForYear, isSupportedYear, NsaaPartKey, SupportedYear } from '@/lib/exam-catalog'

function EsatMockInner() {
  const searchParams = useSearchParams()
  const exam = String(searchParams.get('exam') || '').toLowerCase() as ExamTrack
  const year = String(searchParams.get('year') || '')

  if (!isSupportedYear(year) || (exam !== 'engaa' && exam !== 'nsaa')) {
    return (
      <main className="min-h-screen warm-shell p-6 md:p-10">
        <div className="max-w-4xl mx-auto warm-card rounded-2xl p-6">
          <h1 className="text-2xl font-black text-slate-900">Invalid ESAT route</h1>
          <p className="text-slate-600 mt-2">Please start from ESAT hub and choose track/year again.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/esat" className="warm-primary-btn px-4 py-2 rounded-lg text-sm">Back to ESAT</Link>
          </div>
        </div>
      </main>
    )
  }

  if (exam === 'engaa') {
    return <ExamRunner year={year} exam="engaa" />
  }

  const nsaaYear = year as SupportedYear
  const nsaaParts = String(searchParams.get('parts') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, idx, arr) => arr.indexOf(item) === idx)
    .filter((item): item is NsaaPartKey => isNsaaPartAvailableForYear(nsaaYear, item))
    .slice(0, 2)

  if (nsaaParts.length < 1) {
    return (
      <main className="min-h-screen warm-shell p-6 md:p-10">
        <div className="max-w-4xl mx-auto warm-card rounded-2xl p-6">
          <h1 className="text-2xl font-black text-slate-900">Missing NSAA parts</h1>
          <p className="text-slate-600 mt-2">Choose one or two parts first.</p>
          <div className="mt-4 flex gap-2">
            <Link href={`/esat/nsaa/${year}`} className="warm-primary-btn px-4 py-2 rounded-lg text-sm">Back to NSAA {year}</Link>
          </div>
        </div>
      </main>
    )
  }

  return <ExamRunner year={year} exam="nsaa" nsaaParts={nsaaParts} />
}

export default function EsatMockPage() {
  return (
    <Suspense
      fallback={
        <div className="exam-loading-shell">
          <div className="exam-loading-core">
            <span className="exam-loading-dot" />
            Preparing your ESAT paper...
          </div>
        </div>
      }
    >
      <EsatMockInner />
    </Suspense>
  )
}
