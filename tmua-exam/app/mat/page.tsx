import Link from 'next/link'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import RevealOnScroll from '@/components/RevealOnScroll'
import TmuaSiteHeader from '@/components/TmuaSiteHeader'
import { MAT_MANIFEST, formatBytes, groupMaterials, uniqueYears } from '@/lib/admissions-library'

export const metadata = {
  title: 'MAT Papers and Solutions',
  description: 'Local MAT library with papers, solutions, reports, and specimen documents downloaded from Physics & Maths Tutor.',
}

export default function MatPage() {
  const groups = groupMaterials(MAT_MANIFEST.items)
  const years = uniqueYears(MAT_MANIFEST.items)

  return (
    <main className="warm-shell min-h-screen overflow-hidden p-6 md:p-10">
      <AnimatedBackdrop intensity="strong" tone="warm" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <TmuaSiteHeader />

        <RevealOnScroll>
          <section className="warm-card rounded-[2rem] p-7 md:p-9">
            <p className="warm-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              MAT Library
            </p>
            <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Local MAT papers, solutions, reports, and specimen material.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              The MAT files have been downloaded into the local app and grouped here so they stay separate from the TMUA mock system.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Files</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{MAT_MANIFEST.count}</div>
              </div>
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Years covered</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{years[years.length - 1]}-{years[0]}</div>
              </div>
              <div className="warm-card-muted rounded-2xl p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Library size</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{formatBytes(MAT_MANIFEST.totalBytes)}</div>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {groups.map((group, index) => (
          <RevealOnScroll key={group.key} delayMs={70 + index * 20}>
            <section className="warm-card rounded-2xl p-6 md:p-7">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{group.label}</h2>
                  <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                </div>
                <div className="text-sm text-slate-500">{group.items.length} files</div>
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
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{item.year ?? 'General'}</div>
                      <div className="text-xs text-slate-500">{formatBytes(item.sizeBytes)}</div>
                    </div>
                    <div className="mt-2 text-base font-bold text-slate-900">{item.title}</div>
                    <div className="mt-2 text-xs text-slate-500">Open local PDF</div>
                  </a>
                ))}
              </div>
            </section>
          </RevealOnScroll>
        ))}

        <section className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="warm-outline-btn rounded-lg px-4 py-2 text-sm font-semibold">Back to Platform</Link>
          <Link href="/tmua/mock" className="warm-primary-btn rounded-lg px-4 py-2 text-sm">Open TMUA Mock</Link>
        </section>
      </div>
    </main>
  )
}
