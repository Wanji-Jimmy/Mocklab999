'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const MESSAGES = [
  'Stay calm. Think clearly. Aim high.',
  'Sharp logic, steady pace, strong score.',
  'You are ready. Let the math speak.',
  'Focus for 90 minutes. Own this mock.',
]

const WARM_ROUTES = new Set(['/', '/dashboard', '/account', '/mistakes'])
const PUSH_DELAY_MS = 360
const MIN_LAUNCH_MS = 860
const REVEAL_MS = 620
const FAILSAFE_MS = 7000

type Phase = 'idle' | 'launch' | 'reveal'

export default function ExamLaunchTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState(MESSAGES[0])
  const [portalReady, setPortalReady] = useState(false)
  const pushTimerRef = useRef<number | null>(null)
  const revealDelayRef = useRef<number | null>(null)
  const revealDoneRef = useRef<number | null>(null)
  const failSafeRef = useRef<number | null>(null)
  const lockRef = useRef(false)
  const startTimeRef = useRef(0)
  const destinationRef = useRef<string | null>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (phase === 'idle') {
      document.body.classList.remove('exam-launching')
      return
    }
    document.body.classList.add('exam-launching')
    return () => {
      document.body.classList.remove('exam-launching')
    }
  }, [phase])

  useEffect(() => {
    if (!portalReady) return

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      let url: URL
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return
      if (!url.pathname.startsWith('/exam')) return
      if (!WARM_ROUTES.has(window.location.pathname)) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (lockRef.current) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      lockRef.current = true
      startTimeRef.current = performance.now()
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
      setPhase('launch')

      const destination = `${url.pathname}${url.search}${url.hash}`
      destinationRef.current = destination
      router.prefetch(destination)

      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
      if (revealDelayRef.current) window.clearTimeout(revealDelayRef.current)
      if (revealDoneRef.current) window.clearTimeout(revealDoneRef.current)
      if (failSafeRef.current) window.clearTimeout(failSafeRef.current)

      pushTimerRef.current = window.setTimeout(() => {
        router.push(destination)
      }, PUSH_DELAY_MS)

      failSafeRef.current = window.setTimeout(() => {
        setPhase('idle')
        lockRef.current = false
        destinationRef.current = null
      }, FAILSAFE_MS)
    }

    window.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('click', onClick, true)
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current)
      if (revealDelayRef.current) window.clearTimeout(revealDelayRef.current)
      if (revealDoneRef.current) window.clearTimeout(revealDoneRef.current)
      if (failSafeRef.current) window.clearTimeout(failSafeRef.current)
    }
  }, [portalReady, router])

  useEffect(() => {
    if (!lockRef.current) return
    if (!destinationRef.current) return
    if (!pathname.startsWith('/exam')) return
    if (phase === 'reveal') return

    const elapsed = performance.now() - startTimeRef.current
    const delay = Math.max(0, MIN_LAUNCH_MS - elapsed)

    if (revealDelayRef.current) window.clearTimeout(revealDelayRef.current)
    if (revealDoneRef.current) window.clearTimeout(revealDoneRef.current)
    if (failSafeRef.current) window.clearTimeout(failSafeRef.current)

    revealDelayRef.current = window.setTimeout(() => {
      setPhase('reveal')
      revealDoneRef.current = window.setTimeout(() => {
        setPhase('idle')
        lockRef.current = false
        destinationRef.current = null
      }, REVEAL_MS)
    }, delay)
  }, [pathname, phase])

  if (!portalReady) return null

  const subcopy = phase === 'reveal' ? 'Loading questions and timer...' : 'Entering TMUA exam mode...'

  return (
    <div
      className={`exam-launch-overlay ${phase !== 'idle' ? 'is-active' : ''} ${phase === 'launch' ? 'is-launch' : ''} ${phase === 'reveal' ? 'is-reveal' : ''}`}
      aria-hidden
    >
      <div className="exam-launch-warm-layer" />
      <div className="exam-launch-cool-layer" />
      <div className="exam-launch-noise-layer" />
      <div className="exam-launch-light-sweep" />
      <div className="exam-launch-copy-wrap">
        <p className="exam-launch-copy">{message}</p>
        <p className="exam-launch-subcopy">{subcopy}</p>
        <div className="exam-launch-meter" aria-hidden>
          <span className="exam-launch-meter-bar" />
        </div>
      </div>
    </div>
  )
}
