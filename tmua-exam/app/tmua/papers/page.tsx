import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'

const TMUA_YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']

export const metadata = {
  title: 'TMUA Papers',
  description: 'Open TMUA year sets by paper. Paper 1 and Paper 2 are launched separately from the existing TMUA exam system.',
}

export default function TmuaPapersPage() {
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
              Open TMUA year papers directly, without changing the existing mock engine.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              This section is separate from the full mock module. Use it when you want to jump straight into Paper 1 or Paper 2 for a specific year.
            </p>
          </section>
        </RevealOnScroll>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TMUA_YEARS.map((year, index) => (
            <RevealOnScroll key={year} delayMs={80 + index * 25}>
              <article className="warm-card rounded-2xl p-5 h-full">
                <div className="text-4xl font-black warm-accent-text">{year}</div>
                <div className="mt-2 text-sm text-slate-600">Launch a specific paper or run the full timed sequence.</div>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href={`/exam/${year}?paper=1&q=1`} className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                    Open Paper 1
                  </Link>
                  <Link href={`/exam/${year}?paper=2&q=1`} className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">
                    Open Paper 2
                  </Link>
                  <Link href={`/exam/${year}`} className="warm-primary-btn rounded-lg px-4 py-2 text-sm">
                    Run Full Mock
                  </Link>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </section>
      </div>
    </main>
  )
}
