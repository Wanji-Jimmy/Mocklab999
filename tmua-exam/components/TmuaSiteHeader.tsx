import Link from 'next/link'
import MockLabLogo from '@/components/MockLabLogo'

type NavKey =
  | 'home'
  | 'dashboard'
  | 'tmua-mock'
  | 'tmua-papers'
  | 'step'
  | 'mat'
  | 'score-converter'
  | 'resources'
  | 'guides'
  | 'account'
  | 'mistakes'

const NAV_ITEMS: Array<{ key: NavKey; href: string; label: string }> = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'dashboard', href: '/dashboard', label: 'Platform' },
  { key: 'tmua-mock', href: '/tmua/mock', label: 'TMUA Mock' },
  { key: 'tmua-papers', href: '/tmua/papers', label: 'TMUA Papers' },
  { key: 'step', href: '/step', label: 'STEP' },
  { key: 'mat', href: '/mat', label: 'MAT' },
  { key: 'account', href: '/account', label: 'My Account' },
]

export default function TmuaSiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <MockLabLogo tone="warm" />
      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`${active === item.key ? 'warm-primary-btn' : 'warm-outline-btn'} rounded-lg px-4 py-2 text-sm font-semibold`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
