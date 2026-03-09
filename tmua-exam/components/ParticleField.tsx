'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  phase: number
  colorKey: number
}

interface ParticleFieldProps {
  className?: string
  particleCount?: number
  tone?: 'cool' | 'warm'
}

export default function ParticleField({ className = '', particleCount = 85, tone = 'cool' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    const particles: Particle[] = []
    const pointer = { x: 0, y: 0, active: false }
    const pulse = { x: 0, y: 0, startedAt: 0, hue: 0 }
    let raf = 0
    let pointerDecayTimer = 0
    const palette = tone === 'warm'
      ? ['255, 137, 52', '255, 186, 86', '248, 221, 108', '170, 214, 105', '96, 191, 134']
      : ['44, 118, 255', '58, 153, 255', '0, 196, 255', '119, 128, 255']

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const init = () => {
      particles.length = 0
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      for (let i = 0; i < particleCount; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.8 + 0.7,
          phase: Math.random() * Math.PI * 2,
          colorKey: Math.floor(Math.random() * palette.length),
        })
      }
    }

    const syncPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = clientX - rect.left
      pointer.y = clientY - rect.top
      pointer.active = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height
      window.clearTimeout(pointerDecayTimer)
      pointerDecayTimer = window.setTimeout(() => {
        pointer.active = false
      }, 850)
    }

    const onPointerMove = (event: PointerEvent) => {
      syncPointer(event.clientX, event.clientY)
    }

    const onPointerDown = (event: PointerEvent) => {
      syncPointer(event.clientX, event.clientY)
      pulse.x = pointer.x
      pulse.y = pointer.y
      pulse.startedAt = performance.now()
      pulse.hue = tone === 'warm'
        ? [28, 44, 58, 214, 262][Math.floor(Math.random() * 5)]
        : [206, 224, 246, 266][Math.floor(Math.random() * 4)]
    }

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      context.clearRect(0, 0, width, height)
      const now = performance.now() * 0.001

      if (pulse.startedAt > 0) {
        const elapsed = performance.now() - pulse.startedAt
        if (elapsed < 720) {
          const progress = elapsed / 720
          const radius = 18 + progress * 240
          const alpha = (1 - progress) * 0.36
          context.beginPath()
          context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2)
          context.strokeStyle = tone === 'warm'
            ? `hsla(${pulse.hue}, 94%, 68%, ${alpha})`
            : `rgba(98, 150, 255, ${alpha})`
          context.lineWidth = 1.7 - progress * 0.7
          context.stroke()
        } else {
          pulse.startedAt = 0
        }
      }

      if (pointer.active) {
        const glowRadius = Math.max(160, Math.min(width, height) * 0.28)
        const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, glowRadius)
        if (tone === 'warm') {
          gradient.addColorStop(0, 'rgba(109, 136, 255, 0.26)')
          gradient.addColorStop(0.33, 'rgba(164, 138, 255, 0.24)')
          gradient.addColorStop(0.62, 'rgba(216, 150, 255, 0.2)')
          gradient.addColorStop(0.8, 'rgba(255, 182, 91, 0.1)')
          gradient.addColorStop(1, 'rgba(78, 116, 255, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(66, 137, 255, 0.22)')
          gradient.addColorStop(1, 'rgba(66, 137, 255, 0)')
        }
        context.fillStyle = gradient
        context.fillRect(0, 0, width, height)
      } else if (tone === 'warm') {
        const orbitX = width * (0.48 + Math.sin(now * 0.32) * 0.18)
        const orbitY = height * (0.44 + Math.cos(now * 0.27) * 0.16)
        const orbit2X = width * (0.56 + Math.cos(now * 0.24) * 0.2)
        const orbit2Y = height * (0.56 + Math.sin(now * 0.29) * 0.14)
        const radius = Math.max(width, height) * 0.58

        const idleGradientA = context.createRadialGradient(orbitX, orbitY, 0, orbitX, orbitY, radius)
        idleGradientA.addColorStop(0, 'rgba(112, 134, 255, 0.18)')
        idleGradientA.addColorStop(0.38, 'rgba(166, 136, 255, 0.15)')
        idleGradientA.addColorStop(0.7, 'rgba(216, 150, 255, 0.13)')
        idleGradientA.addColorStop(1, 'rgba(255, 255, 255, 0)')
        context.fillStyle = idleGradientA
        context.fillRect(0, 0, width, height)

        const idleGradientB = context.createRadialGradient(orbit2X, orbit2Y, 0, orbit2X, orbit2Y, radius * 0.8)
        idleGradientB.addColorStop(0, 'rgba(129, 126, 255, 0.12)')
        idleGradientB.addColorStop(0.5, 'rgba(255, 180, 114, 0.06)')
        idleGradientB.addColorStop(1, 'rgba(255, 255, 255, 0)')
        context.fillStyle = idleGradientB
        context.fillRect(0, 0, width, height)
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]

        if (pointer.active) {
          const dx = pointer.x - p.x
          const dy = pointer.y - p.y
          const distanceSq = dx * dx + dy * dy
          if (distanceSq > 4) {
            const distance = Math.sqrt(distanceSq)
            const influenceRadius = 220
            if (distance < influenceRadius) {
              const pull = (1 - distance / influenceRadius) * 0.018
              p.vx += (dx / distance) * pull
              p.vy += (dy / distance) * pull
            }
          }
        }

        p.vx *= 0.994
        p.vy *= 0.994
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        context.beginPath()
        context.arc(p.x, p.y, p.r + Math.sin(now + p.phase) * 0.22, 0, Math.PI * 2)
        const pulseAlpha = 0.22 + (Math.sin(now * 1.85 + p.phase) + 1) * 0.09
        context.fillStyle = `rgba(${palette[p.colorKey]}, ${pulseAlpha})`
        context.fill()
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > 140) continue
          const alpha = (1 - distance / 140) * 0.24
          context.beginPath()
          context.moveTo(a.x, a.y)
          context.lineTo(b.x, b.y)
          const lineBase = palette[(a.colorKey + b.colorKey) % palette.length]
          context.strokeStyle = `rgba(${lineBase}, ${alpha})`
          context.lineWidth = 1
          context.stroke()
        }
      }

      raf = window.requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.clearTimeout(pointerDecayTimer)
      window.cancelAnimationFrame(raf)
    }
  }, [particleCount, tone])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
