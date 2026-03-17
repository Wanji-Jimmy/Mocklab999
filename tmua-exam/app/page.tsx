import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { BarChart3, Brain, FileText } from 'lucide-react'
import MockLabLogo from '@/components/MockLabLogo'
import RevealOnScroll from '@/components/RevealOnScroll'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' })

const FEATURE_CARDS = [
  {
    title: 'Authentic Questions',
    description:
      'Run full-paper TMUA practice with the same year-based structure students use for timing calibration and score benchmarking.',
    Icon: FileText,
  },
  {
    title: 'Detailed Solutions',
    description:
      'Review solution logic, not just answer keys, so each mock leads to a cleaner next paper instead of repeated mistakes.',
    Icon: Brain,
  },
  {
    title: 'Performance Tracking',
    description:
      'Use score history, mistake review, and paper-by-paper patterns to decide what to fix before the next timed session.',
    Icon: BarChart3,
  },
] as const

const ACCESS_PANELS = [
  {
    name: 'Full Mocks',
    title: 'Free',
    description: 'Sit full TMUA papers by year and use them to see your real timing level before admissions deadlines.',
    items: ['Full TMUA year selection', 'Score conversion tool', 'Guide library access'],
    cta: 'Open Dashboard',
    href: '/dashboard',
    featured: false,
  },
  {
    name: 'Review Workflow',
    title: 'Included',
    description: 'Use the account space, mistake center, and result flow as part of the same free platform workflow.',
    items: ['Mistake center workflow', 'Account workspace', 'Structured next-step tools'],
    cta: 'Open My Account',
    href: '/account',
    featured: true,
  },
  {
    name: 'Application Guides',
    title: 'Open Access',
    description: 'Read TMUA-focused guide pages for Economics, Mathematics, Computer Science, and related admissions paths.',
    items: ['High-intent guides', 'Score planning support', 'Course-specific reading pages'],
    cta: 'Read Guides',
    href: '/guides',
    featured: false,
  },
] as const

export const metadata: Metadata = {
  title: 'Master the TMUA | MockLab999',
  description:
    'Free TMUA landing page with full mocks, review workflow, and course-focused preparation for Oxbridge-minded applicants.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Master the TMUA | MockLab999',
    description:
      'Timed TMUA mocks, detailed review workflow, and course-focused preparation for applicants aiming at mathematically selective universities.',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: 'Master the TMUA | MockLab999',
    description:
      'Timed TMUA mocks, detailed review workflow, and course-focused preparation for applicants aiming at mathematically selective universities.',
  },
}

export default function Home() {
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description:
      'Timed TMUA mocks, detailed review workflow, and course-focused preparation for applicants aiming at mathematically selective universities.',
    inLanguage: 'en',
  }

  return (
    <main className={`${inter.className} min-h-screen bg-[var(--bg-cream)] text-[var(--text-main)]`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <header className="sticky top-0 z-40 border-b border-[color:rgba(212,175,55,0.3)] bg-[color:rgba(15,36,57,0.96)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <MockLabLogo />

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#f4f1e8]/92 [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] md:flex">
            <a href="#home" className="transition hover:text-white">Home</a>
            <a href="#about-tmua" className="transition hover:text-white">About TMUA</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <Link
            href="/account"
            className="rounded-md bg-[var(--academic-gold)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-[var(--gold-hover)]"
          >
            Login / Sign Up
          </Link>
        </div>

        <div className="border-t border-white/10 px-4 py-2 md:hidden">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto text-sm font-medium text-white/82 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <a href="#home" className="whitespace-nowrap rounded-full border border-white/14 px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Home
            </a>
            <a
              href="#about-tmua"
              className="whitespace-nowrap rounded-full border border-white/14 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
            >
              About TMUA
            </a>
            <a href="#pricing" className="whitespace-nowrap rounded-full border border-white/14 px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Pricing
            </a>
            <a href="#contact" className="whitespace-nowrap rounded-full border border-white/14 px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <section
        id="home"
        className="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden border-b border-[color:rgba(15,36,57,0.08)] sm:min-h-[80vh]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[72%] sm:w-[62%]">
            <Image
              src="/hero/cambridge-kings-college.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 72vw, 62vw"
              className="object-cover object-center scale-[1.14] blur-[4px] brightness-[0.68] saturate-[0.92]"
            />
          </div>
          <div className="absolute inset-y-0 right-0 w-[72%] sm:w-[58%]">
            <Image
              src="/hero/oxford-radcliffe-camera.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 72vw, 58vw"
              className="object-cover object-center scale-[1.18] blur-[4px] brightness-[0.66] saturate-[0.9]"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,36,57,0.86)_0%,rgba(15,36,57,0.78)_22%,rgba(15,36,57,0.6)_44%,rgba(15,36,57,0.6)_56%,rgba(15,36,57,0.78)_78%,rgba(15,36,57,0.86)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_36%),linear-gradient(180deg,rgba(15,36,57,0.18)_0%,rgba(15,36,57,0.12)_100%)]" />
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12 blur-sm" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgba(15,36,57,0.38)] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center text-white sm:px-8">
          <RevealOnScroll>
            <p className="text-sm uppercase tracking-[0.28em] text-white/72">TMUA admissions preparation</p>
            <h1 className={`${playfair.className} mt-6 text-5xl font-semibold leading-[0.96] sm:text-6xl lg:text-7xl`}>
              Master the TMUA. Achieve Your Oxbridge Dream.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#ede7d8] sm:text-xl">
              Free TMUA mocks, structured review tools, and application-focused resources for the Test of Mathematics for University Admission.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-md bg-[var(--academic-gold)] px-8 py-4 text-lg font-semibold text-[var(--text-main)] shadow-[0_18px_38px_rgba(0,0,0,0.24)] transition hover:bg-[var(--gold-hover)]"
              >
                Enter Platform
              </Link>
              <Link
                href="/tmua/mock"
                className="rounded-md border border-white/36 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/16"
              >
                Open TMUA Mock
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="bg-[#F5F2EB] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FEATURE_CARDS.map(({ title, description, Icon }) => (
              <RevealOnScroll key={title}>
                <article className="rounded-xl bg-white p-8 shadow-md">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:rgba(212,175,55,0.14)] text-[var(--nav-blue)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className={`${playfair.className} mt-5 text-3xl font-semibold text-[var(--text-main)]`}>{title}</h2>
                  <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="about-tmua" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <RevealOnScroll>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--nav-blue)]/72">About TMUA</p>
              <h2 className={`${playfair.className} mt-4 text-4xl font-semibold text-[var(--text-main)] sm:text-5xl`}>
                A serious admissions test deserves a serious prep workflow.
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Mocklab999 is built for students who do not want random question banks. You sit a full paper, read the score properly,
                inspect mistakes, and decide the next move with discipline. That is how the platform is structured.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/resources"
                  className="rounded-md border border-[var(--nav-blue)] px-6 py-3 text-sm font-semibold text-[var(--nav-blue)] transition hover:bg-[var(--nav-blue)] hover:text-white"
                >
                  Explore TMUA Resources
                </Link>
                <Link
                  href="/guides"
                  className="rounded-md border border-[color:rgba(15,36,57,0.16)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--academic-gold)] hover:text-[var(--nav-blue)]"
                >
                  Read Application Guides
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={120}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-[var(--nav-blue)] p-6 text-white shadow-[0_20px_50px_rgba(15,36,57,0.2)] sm:col-span-2">
                <div className="text-sm uppercase tracking-[0.24em] text-white/64">Focused platform</div>
                <div className={`${playfair.className} mt-3 text-3xl font-semibold`}>TMUA only. No clutter. No vague workflow.</div>
              </div>
              <div className="rounded-3xl border border-[color:rgba(15,36,57,0.08)] bg-white p-6">
                <div className="text-sm uppercase tracking-[0.22em] text-gray-500">Coverage</div>
                <div className={`${playfair.className} mt-3 text-4xl font-semibold text-[var(--text-main)]`}>2016-2023</div>
                <div className="mt-2 text-sm leading-6 text-gray-600">Full TMUA year sets for repeated timing calibration.</div>
              </div>
              <div className="rounded-3xl border border-[color:rgba(15,36,57,0.08)] bg-white p-6">
                <div className="text-sm uppercase tracking-[0.22em] text-gray-500">Workflow</div>
                <div className={`${playfair.className} mt-3 text-4xl font-semibold text-[var(--text-main)]`}>40 questions</div>
                <div className="mt-2 text-sm leading-6 text-gray-600">Paper 1 and Paper 2 sequencing kept intact.</div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section id="pricing" className="bg-[var(--nav-blue)] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/68">Pricing</p>
              <h2 className={`${playfair.className} mt-4 text-4xl font-semibold sm:text-5xl`}>
                Everything on this platform is free to use.
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/74">
                Use the platform in the way that fits your preparation: full mocks, review workflow, or admissions reading.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ACCESS_PANELS.map((panel, index) => (
              <RevealOnScroll key={panel.name} delayMs={80 + index * 60}>
                <article
                  className={`rounded-[1.75rem] border p-8 ${
                    panel.featured
                      ? 'border-[var(--academic-gold)] bg-white text-[var(--text-main)] shadow-[0_24px_60px_rgba(0,0,0,0.24)]'
                      : 'border-white/14 bg-white/6 text-white'
                  }`}
                >
                  <div className="text-sm uppercase tracking-[0.22em] opacity-72">{panel.name}</div>
                  <div className={`${playfair.className} mt-4 text-4xl font-semibold`}>{panel.title}</div>
                  <p className={`mt-4 text-base leading-7 ${panel.featured ? 'text-gray-600' : 'text-white/72'}`}>{panel.description}</p>
                  <ul className={`mt-6 space-y-3 text-sm ${panel.featured ? 'text-gray-700' : 'text-white/82'}`}>
                    {panel.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${panel.featured ? 'bg-[var(--academic-gold)]' : 'bg-white/72'}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={panel.href}
                    className={`mt-8 inline-flex rounded-md px-5 py-3 text-sm font-semibold transition ${
                      panel.featured
                        ? 'bg-[var(--academic-gold)] text-[var(--text-main)] hover:bg-[var(--gold-hover)]'
                        : 'border border-white/24 bg-white/10 text-white hover:bg-white/16'
                    }`}
                  >
                    {panel.cta}
                  </Link>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[color:rgba(15,36,57,0.08)] bg-white px-6 py-10 shadow-[0_24px_60px_rgba(15,36,57,0.08)] sm:px-8 lg:px-10">
          <RevealOnScroll>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--nav-blue)]/72">Contact</p>
                <h2 className={`${playfair.className} mt-4 text-4xl font-semibold text-[var(--text-main)] sm:text-5xl`}>
                  Start with a full mock. Then decide what needs help.
                </h2>
                <p className="mt-5 text-lg leading-8 text-gray-600">
                  The fastest way to understand your TMUA position is still the same: sit a timed paper, read the result properly, and use the
                  platform tools to plan the next correction.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <Link
                  href="/tmua/mock"
                  className="rounded-md bg-[var(--academic-gold)] px-7 py-4 text-center text-base font-semibold text-[var(--text-main)] transition hover:bg-[var(--gold-hover)]"
                >
                  Open Full Mock
                </Link>
                <Link
                  href="/account"
                  className="rounded-md border border-[var(--nav-blue)] px-7 py-4 text-center text-base font-semibold text-[var(--nav-blue)] transition hover:bg-[var(--nav-blue)] hover:text-white"
                >
                  Login / Sign Up
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  )
}
