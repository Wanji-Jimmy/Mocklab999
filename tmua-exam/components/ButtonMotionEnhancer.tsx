'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SELECTOR = '.warm-primary-btn, .warm-outline-btn'
const WARM_ROUTES = new Set(['/', '/dashboard', '/account'])

export default function ButtonMotionEnhancer() {
  const pathname = usePathname()
  const activeRoute = WARM_ROUTES.has(pathname)

  useEffect(() => {
    if (!activeRoute) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const buttons = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
    const cleanups: Array<() => void> = []

    const spawnRipple = (button: HTMLElement, clientX: number, clientY: number) => {
      const rect = button.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'warm-click-ripple'
      ripple.style.left = `${clientX - rect.left}px`
      ripple.style.top = `${clientY - rect.top}px`
      button.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 520)
    }

    buttons.forEach((button) => {
      const lift = button.classList.contains('warm-primary-btn') ? 7 : 5

      const setSpotlight = (clientX: number, clientY: number) => {
        const rect = button.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        const nx = rect.width > 0 ? (x / rect.width - 0.5) * 2 : 0
        const ny = rect.height > 0 ? (y / rect.height - 0.5) * 2 : 0

        button.style.setProperty('--btn-x', `${x.toFixed(1)}px`)
        button.style.setProperty('--btn-y', `${y.toFixed(1)}px`)
        button.style.setProperty('--btn-translate-x', `${(nx * lift).toFixed(2)}px`)
        button.style.setProperty('--btn-translate-y', `${(ny * lift).toFixed(2)}px`)
      }

      const onPointerEnter = (event: PointerEvent) => {
        button.classList.add('warm-btn-hover')
        setSpotlight(event.clientX, event.clientY)
      }

      const onPointerMove = (event: PointerEvent) => {
        setSpotlight(event.clientX, event.clientY)
      }

      const onPointerLeave = () => {
        button.classList.remove('warm-btn-hover')
        button.classList.remove('warm-btn-press')
        button.style.setProperty('--btn-translate-x', '0px')
        button.style.setProperty('--btn-translate-y', '0px')
      }

      const onPointerDown = () => {
        button.classList.add('warm-btn-press')
      }

      const onPointerDownWithEvent = (event: PointerEvent) => {
        onPointerDown()
        spawnRipple(button, event.clientX, event.clientY)
      }

      const onPointerUp = () => {
        button.classList.remove('warm-btn-press')
      }

      button.style.setProperty('--btn-translate-x', '0px')
      button.style.setProperty('--btn-translate-y', '0px')
      button.style.setProperty('--btn-x', '50%')
      button.style.setProperty('--btn-y', '50%')

      button.addEventListener('pointerenter', onPointerEnter)
      button.addEventListener('pointermove', onPointerMove)
      button.addEventListener('pointerleave', onPointerLeave)
      button.addEventListener('pointerdown', onPointerDownWithEvent)
      button.addEventListener('pointerup', onPointerUp)
      button.addEventListener('pointercancel', onPointerUp)

      cleanups.push(() => {
        button.removeEventListener('pointerenter', onPointerEnter)
        button.removeEventListener('pointermove', onPointerMove)
        button.removeEventListener('pointerleave', onPointerLeave)
        button.removeEventListener('pointerdown', onPointerDownWithEvent)
        button.removeEventListener('pointerup', onPointerUp)
        button.removeEventListener('pointercancel', onPointerUp)
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [pathname, activeRoute])

  return null
}
