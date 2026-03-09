import Link from 'next/link'

interface MockLabLogoProps {
  href?: string
  className?: string
  tone?: 'cool' | 'warm'
}

export default function MockLabLogo({ href = '/', className = '', tone = 'cool' }: MockLabLogoProps) {
  const markClass =
    tone === 'warm'
      ? 'mocklab-logo-mark-warm relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 shadow-lg ring-1 ring-[#c8e28f]/62'
      : 'mocklab-logo-mark relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 shadow-lg ring-1 ring-blue-300/60'
  const coreClass =
    tone === 'warm'
      ? 'mocklab-logo-core-warm absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffad5a]/34 via-[#d7e57c]/18 to-[#0f172a]/30'
      : 'mocklab-logo-core absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/25 via-cyan-400/10 to-slate-900/30'
  const orbitClass = tone === 'warm' ? 'mocklab-logo-orbit-warm' : 'mocklab-logo-orbit'
  const titleClass =
    tone === 'warm'
      ? 'block text-xl font-black tracking-tight text-[#3a3f1f] group-hover:text-[#5b662f] transition-colors'
      : 'block text-xl font-black tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors'

  return (
    <Link href={href} className={`inline-flex items-center gap-3 group ${className}`} aria-label="MockLab999 Home">
      <span className={markClass}>
        <span className={coreClass} />
        <span className={orbitClass} />
        <svg viewBox="0 0 64 64" className="relative z-10 h-7 w-7" fill="none" aria-hidden>
          <path d="M10 45 18 17h6l8 20 8-20h6l8 28h-6l-5-18-7 18h-6l-7-18-5 18h-6Z" fill="url(#mocklabGrad)" />
          <defs>
            <linearGradient id="mocklabGrad" x1="10" y1="12" x2="56" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor={tone === 'warm' ? '#FFD07A' : '#7DD3FC'} />
              <stop offset="1" stopColor={tone === 'warm' ? '#7DC96F' : '#3B82F6'} />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Exam Lab</span>
        <span className={titleClass}>
          MockLab999
        </span>
      </span>
    </Link>
  )
}
