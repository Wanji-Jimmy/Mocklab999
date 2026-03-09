'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface RevealOnScrollProps {
  children: ReactNode
  className?: string
  delayMs?: number
}

export default function RevealOnScroll({ children, className = '', delayMs = 0 }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Failsafe: ensure sections never remain hidden if observer misses.
    const fallbackTimer = window.setTimeout(() => setVisible(true), 900 + delayMs)

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return () => window.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallbackTimer)
    }
  }, [delayMs])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
