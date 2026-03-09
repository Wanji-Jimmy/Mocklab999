'use client'

import Link from 'next/link'
import SystemSwitchBar from '@/components/SystemSwitchBar'
import { SUPPORTED_YEARS } from '@/lib/exam-catalog'

export default function NsaaYearsPage() {
  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-slate-900">NSAA 2016-2023</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SystemSwitchBar active="esat" />
            <Link href="/esat" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Back
            </Link>
          </div>
        </div>
        <p className="text-slate-600 mb-6">Choose one year, then choose 1 or 2 parts for your paper combination.</p>
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUPPORTED_YEARS.map((year) => (
            <Link key={year} href={`/esat/nsaa/${year}`} className="warm-card rounded-2xl p-5 text-center hover-lift">
              <div className="text-4xl font-black warm-accent-text">{year}</div>
              <div className="mt-2 text-xs text-slate-500">Mandatory Math + Parts</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
