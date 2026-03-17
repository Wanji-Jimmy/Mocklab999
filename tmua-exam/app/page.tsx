import Link from 'next/link'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { BarChart3, Brain, FileText, Shield } from 'lucide-react'
import RevealOnScroll from '@/components/RevealOnScroll'
import { absoluteUrl, SITE_NAME } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' })

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1531346808168-9de9ad4a42b1?auto=format&fit=crop&w=1600&q=80'

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

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For students who want to sit full mocks and see where their current TMUA level actually is.',
    items: ['Full TMUA year selection', 'Score conversion tool', 'Guide library access'],
    cta: 'Open Dashboard',
    href: '/dashboard',
    featured: false,
  },
  {
    name: 'Practice System',
    price: 'Core Workflow',
    description: 'For applicants who want a stable routine: timed mocks, post-paper review, and a cleaner next action every week.',
    items: ['Mistake center workflow', 'Account workspace', 'Structured next-step tools'],
    cta: 'Open My Account',
    href: '/account',
    featured: true,
  },
  {
    name: 'Admissions Prep',
    price: 'Course-Focused',
    description: 'For students who need TMUA preparation tied to Economics, Mathematics, Computing, and related application paths.',
    items: ['High-intent guides', 'Score planning support', 'Course-specific reading pages'],
    cta: 'Read Guides',
    href: '/guides',
    featured: false,
  },
] as const

export const metadata: Metadata = {
  title: 'Master the TMUA | MockLab999',
  description:
    'Premium-style TMUA landing page with full mocks, expert-style review workflow, and course-focused preparation for Oxbridge-minded applicants.',
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
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--academic-gold)]/60 bg-white/5">
              <Shield className="h-5 w-5 text-[var(--academic-gold)]" />
            </span>
            <span className={`${playfair.className} text-2xl font-semibold tracking-tight`}>Mocklab999</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/82 md:flex">
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
        className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden border-b border-[color:rgba(15,36,57,0.08)]"
        style={{
          backgroundImage: `linear-gradient(rgba(7, 18, 31, 0.66), rgba(7, 18, 31, 0.66)), url(${HERO_IMAGE})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,36,57,0.36)_0%,rgba(15,36,57,0.18)_45%,rgba(15,36,57,0.5)_100%)]" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center text-white sm:px-8">
          <RevealOnScroll>
            <p className="text-sm uppercase tracking-[0.28em] text-white/72">TMUA admissions preparation</p>
            <h1 className={`${playfair.className} mt-6 text-5xl font-semibold leading-[0.96] sm:text-6xl lg:text-7xl`}>
              Master the TMUA. Achieve Your Oxbridge Dream.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#ede7d8] sm:text-xl">
              Premium mock exams and expert resources for the Test of Mathematics for University Admission.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-md bg-[var(--academic-gold)] px-8 py-4 text-lg font-semibold text-[var(--text-main)] shadow-[0_18px_38px_rgba(0,0,0,0.24)] transition hover:bg-[var(--gold-hover)]"
              >
                Start Practicing Now
              </Link>
              <Link
                href="/score-converter"
                className="rounded-md border border-white/36 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/16"
              >
                Convert My Score
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="relative z-10 -mt-16 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[color:rgba(212,175,55,0.45)] bg-[var(--bg-cream)] p-6 shadow-[0_24px_60px_rgba(15,36,57,0.16)] sm:p-8 lg:p-10">
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURE_CARDS.map(({ title, description, Icon }) => (
              <RevealOnScroll key={title}>
                <article className="rounded-2xl border border-[color:rgba(15,36,57,0.08)] bg-white/68 p-6 shadow-[0_12px_30px_rgba(15,36,57,0.06)]">
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
                Pick the access path that matches how you prepare.
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/74">
                This landing page keeps the pricing language simple. The real distinction is not flashy tiers; it is whether you want raw access,
                structured workflow, or course-focused preparation material.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan, index) => (
              <RevealOnScroll key={plan.name} delayMs={80 + index * 60}>
                <article
                  className={`rounded-[1.75rem] border p-8 ${
                    plan.featured
                      ? 'border-[var(--academic-gold)] bg-white text-[var(--text-main)] shadow-[0_24px_60px_rgba(0,0,0,0.24)]'
                      : 'border-white/14 bg-white/6 text-white'
                  }`}
                >
                  <div className="text-sm uppercase tracking-[0.22em] opacity-72">{plan.name}</div>
                  <div className={`${playfair.className} mt-4 text-4xl font-semibold`}>{plan.price}</div>
                  <p className={`mt-4 text-base leading-7 ${plan.featured ? 'text-gray-600' : 'text-white/72'}`}>{plan.description}</p>
                  <ul className={`mt-6 space-y-3 text-sm ${plan.featured ? 'text-gray-700' : 'text-white/82'}`}>
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${plan.featured ? 'bg-[var(--academic-gold)]' : 'bg-white/72'}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-8 inline-flex rounded-md px-5 py-3 text-sm font-semibold transition ${
                      plan.featured
                        ? 'bg-[var(--academic-gold)] text-[var(--text-main)] hover:bg-[var(--gold-hover)]'
                        : 'border border-white/24 bg-white/10 text-white hover:bg-white/16'
                    }`}
                  >
                    {plan.cta}
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
                  href="/dashboard"
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
