import Link from 'next/link'
import { ADMISSIONS_GUIDES } from '@/lib/admissions-guides'

export const metadata = {
  title: 'Admissions Guides | MockLab999',
  description: 'High-intent admissions guides for TMUA, ESAT, and course-specific preparation pathways.',
}

export default function GuidesIndexPage() {
  return (
    <main className="min-h-screen warm-shell p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="warm-card rounded-2xl p-6 md:p-8">
          <p className="inline-flex warm-pill rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">Admissions Guides</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900">Application Pathway Knowledge Base</h1>
          <p className="mt-3 text-slate-600 max-w-4xl">
            Structured guides for TMUA/ESAT pathways, with high-intent coverage for Cambridge, UCL, Imperial, LSE, and Warwick searches.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          {ADMISSIONS_GUIDES.map((guide) => (
            <article key={guide.slug} className="warm-card rounded-2xl p-6 hover-lift">
              <h2 className="text-xl font-black text-slate-900">{guide.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{guide.description}</p>
              <div className="mt-3 text-xs text-slate-500">Primary: {guide.primaryTest}</div>
              <div className="mt-1 text-xs text-slate-500">Last updated: {guide.updatedAt}</div>
              <Link href={`/guides/${guide.slug}`} className="warm-primary-btn mt-5 px-4 py-2 rounded-lg inline-flex text-sm">
                Read Guide
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
