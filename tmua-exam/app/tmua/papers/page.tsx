import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { TMUA_MANIFEST, formatBytes, uniqueYears } from '@/lib/admissions-library'

const MATERIAL_LABELS: Record<string, string> = {
  'paper-1': 'Official Paper 1 PDF',
  'worked-answer-paper-1': 'Paper 1 Worked Answers',
  'paper-2': 'Official Paper 2 PDF',
  'worked-answer-paper-2': 'Paper 2 Worked Answers',
  'answer-key': 'Answer Key',
  specimen: 'Specimen PDF',
  document: 'Official PDF',
}

export const metadata = {
  title: 'TMUA Papers',
  description: 'Local TMUA official PDF library with papers, worked answers, answer keys, and direct entry into the existing TMUA exam system.',
}

export default function TmuaPapersPage() {
  const years = uniqueYears(TMUA_MANIFEST.items)
  const groups = [
    ...years.map((year) => ({
      key: String(year),
      title: String(year),
      items: TMUA_MANIFEST.items
        .filter((item) => item.category === String(year))
        .sort((a, b) => (a.sortOrder ?? 90) - (b.sortOrder ?? 90)),
    })),
    {
      key: 'specimen',
      title: 'Early Specimen',
      items: TMUA_MANIFEST.items
        .filter((item) => item.category === 'specimen')
        .sort((a, b) => (a.sortOrder ?? 90) - (b.sortOrder ?? 90)),
    },
  ]

  return (
    <main className="warm-shell min-h-screen overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader />

        <RevealOnScroll>
          <section className="warm-card rounded-[2rem] p-7 md:p-9">
            <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              TMUA Papers
            </p>
            <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Official TMUA papers, worked answers, and answer keys, all hosted locally.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              This page now combines two workflows: open the official PDFs from the current TMUA preparation materials page, or jump straight into the existing TMUA exam engine for a chosen year.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Files</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{TMUA_MANIFEST.count}</div>
              </div>
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Years covered</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{years[years.length - 1]}-{years[0]}</div>
              </div>
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Library size</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{formatBytes(TMUA_MANIFEST.totalBytes)}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tmua/mock" className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                Open TMUA Mock
              </Link>
              <Link href="/dashboard" className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                Back to Platform
              </Link>
            </div>
          </section>
        </RevealOnScroll>

        {groups.map((group, index) => (
          <RevealOnScroll key={group.key} delayMs={80 + index * 25}>
            <section className="warm-card rounded-2xl p-6 md:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {group.key === 'specimen' ? 'Official materials' : 'Official year set'}
                  </div>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">{group.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                    {group.key === 'specimen'
                      ? 'Early specimen files from the official TMUA preparation materials page.'
                      : 'Open official PDFs for this year, or jump directly into the existing Paper 1 / Paper 2 / full mock workflow.'}
                  </p>
                </div>
                {group.key !== 'specimen' && (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/exam/${group.key}?paper=1&q=1`} className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                      Open Paper 1
                    </Link>
                    <Link href={`/exam/${group.key}?paper=2&q=1`} className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                      Open Paper 2
                    </Link>
                    <Link href={`/exam/${group.key}`} className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                      Run Full Mock
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="warm-card-muted rounded-2xl p-4 hover-lift"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        {group.key === 'specimen' ? 'Specimen' : group.title}
                      </div>
                      <div className="text-xs text-slate-500">{formatBytes(item.sizeBytes)}</div>
                    </div>
                    <div className="mt-2 text-base font-bold text-slate-900">{MATERIAL_LABELS[item.type] ?? item.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.title}</div>
                    <div className="mt-2 text-xs text-slate-500">Open local PDF</div>
                  </a>
                ))}
              </div>
            </section>
          </RevealOnScroll>
        ))}
      </div>
    </main>
  )
}
