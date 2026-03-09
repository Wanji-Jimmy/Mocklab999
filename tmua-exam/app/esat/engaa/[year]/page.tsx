import Link from 'next/link'
import { notFound } from 'next/navigation'
import SystemSwitchBar from '@/components/SystemSwitchBar'
import { isSupportedYear } from '@/lib/exam-catalog'

export default function EngaaYearPage({ params }: { params: { year: string } }) {
  if (!isSupportedYear(params.year)) notFound()

  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-slate-900">ENGAA {params.year}</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SystemSwitchBar active="esat" />
            <Link href="/esat/engaa" className="warm-outline-btn px-4 py-2 rounded-lg text-sm font-semibold">Back</Link>
          </div>
        </div>

        <section className="warm-card rounded-2xl p-6">
          <h2 className="text-xl font-black text-slate-900">Paper Structure</h2>
          <p className="mt-2 text-slate-600">This mock includes Paper 1 and Paper 2.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <div className="warm-card-muted rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900">Paper 1</div>
              <div className="text-sm text-slate-600 mt-1">First paper from official {params.year} ENGAA set.</div>
            </div>
            <div className="warm-card-muted rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900">Paper 2</div>
              <div className="text-sm text-slate-600 mt-1">Second paper from official {params.year} ENGAA set.</div>
            </div>
          </div>

          <Link
            href={`/esat/mock?exam=engaa&year=${params.year}`}
            className="warm-primary-btn mt-6 px-5 py-2.5 rounded-lg inline-flex"
          >
            Start ENGAA Mock
          </Link>
        </section>
      </div>
    </main>
  )
}
