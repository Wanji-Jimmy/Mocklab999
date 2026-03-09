import Link from 'next/link'

export default function SystemSwitchBar({ active }: { active: 'tmua' | 'esat' }) {
  const isTmua = active === 'tmua'

  return (
    <div className="warm-card-muted rounded-xl p-2 inline-flex gap-2">
      <Link
        href="/dashboard"
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          isTmua ? 'warm-primary-btn' : 'warm-outline-btn'
        }`}
      >
        TMUA System
      </Link>
      <Link
        href="/esat"
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          !isTmua ? 'warm-primary-btn' : 'warm-outline-btn'
        }`}
      >
        ESAT System
      </Link>
    </div>
  )
}
