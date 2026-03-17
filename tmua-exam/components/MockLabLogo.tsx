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
      ? 'h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.015]'
      : 'h-12 w-auto object-contain mix-blend-lighten transition-transform duration-200 group-hover:scale-[1.015]'

  return (
    <Link href={href} className={`group inline-flex items-center ${className}`} aria-label="MockLab999 Home">
      <Image
        src={tone === 'warm' ? '/brand/mocklab999-logo.svg' : '/brand/mocklab999-logo-clear.svg'}
        alt="MockLab999"
        width={960}
        height={300}
        sizes="(max-width: 640px) 172px, 220px"
        className={imageClass}
        priority={false}
      />
    </Link>
  )
}
