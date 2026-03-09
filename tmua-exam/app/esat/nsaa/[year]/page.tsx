'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import SystemSwitchBar from '@/components/SystemSwitchBar'
import { SupportedYear, getNsaaPartsByYear, isSupportedYear } from '@/lib/exam-catalog'

export default function NsaaPartSelectPage({ params }: { params: { year: string } }) {
  const [selected, setSelected] = useState<string[]>([])

  if (!isSupportedYear(params.year)) {
    return (
      <main className="min-h-screen warm-shell p-6 md:p-10">
        <div className="max-w-4xl mx-auto warm-card rounded-2xl p-6">
          <h1 className="text-2xl font-black text-slate-900">Invalid year</h1>
          <Link href="/esat/nsaa" className="warm-primary-btn mt-4 px-4 py-2 rounded-lg inline-flex">
            Back to NSAA Years
          </Link>
        </div>
      </main>
    )
  }

  const nsaaYear = params.year as SupportedYear
  const availableParts = getNsaaPartsByYear(nsaaYear)

  const togglePart = (part: string) => {
    setSelected((prev) => {
      if (prev.includes(part)) return prev.filter((item) => item !== part)
      if (prev.length >= 2) return prev
      return [...prev, part]
    })
  }

  const startHref = useMemo(() => {
    if (selected.length === 0) return '#'
    const paramsObj = new URLSearchParams({ parts: selected.join(',') })
    return `/esat/nsaa/${params.year}/exam?${paramsObj.toString()}`
  }, [params.year, selected])

  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-slate-900">NSAA {params.year}</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SystemSwitchBar active="esat" />
            <Link href="/esat/nsaa" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">
              Back to Years
            </Link>
          </div>
        </div>
        <p className="text-slate-600 mb-2">Paper 1 is mandatory mathematics.</p>
        <p className="text-slate-600 mb-6">Choose 1 or 2 Parts for the remaining papers.</p>

        <section className="grid md:grid-cols-2 gap-4">
          {availableParts.map((part) => {
            const active = selected.includes(part.key)
            return (
              <button
                key={part.key}
                onClick={() => togglePart(part.key)}
                className={`text-left rounded-2xl p-6 border transition ${
                  active ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <h2 className="text-xl font-black text-slate-900">{part.label}</h2>
                <p className="text-sm text-slate-600 mt-2">{active ? 'Selected' : 'Click to select this Part'}</p>
              </button>
            )
          })}
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-700">Selected: {selected.length}/2</div>
          {availableParts.length < 4 && (
            <div className="text-sm text-amber-700">Part E is not available for NSAA {params.year} official paper.</div>
          )}
          <Link
            href={startHref}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${
              selected.length > 0 ? 'warm-primary-btn' : 'bg-slate-300 text-slate-500 pointer-events-none'
            }`}
          >
            Start NSAA Mock
          </Link>
        </div>
      </div>
    </main>
  )
}
