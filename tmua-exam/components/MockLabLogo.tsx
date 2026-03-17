import Image from 'next/image'
import Link from 'next/link'

interface MockLabLogoProps {
  href?: string
  className?: string
  tone?: 'cool' | 'warm'
}

export default function MockLabLogo({ href = '/', className = '', tone = 'cool' }: MockLabLogoProps) {
  const imageClass =
    tone === 'warm'
      ? 'h-14 w-auto drop-shadow-[0_12px_26px_rgba(15,36,57,0.18)] transition-transform duration-200 group-hover:scale-[1.015]'
      : 'h-14 w-auto drop-shadow-[0_12px_26px_rgba(2,6,23,0.26)] transition-transform duration-200 group-hover:scale-[1.015]'

  return (
    <Link href={href} className={`group inline-flex items-center ${className}`} aria-label="MockLab999 Home">
      <Image
        src="/brand/mocklab999-logo.svg"
        alt="MockLab999"
        width={960}
        height={300}
        sizes="(max-width: 640px) 180px, 240px"
        className={imageClass}
        priority={false}
      />
    </Link>
  )
}
