/* eslint-disable react/no-unknown-property */
'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type ParticleShape = 'capsule' | 'sphere' | 'box' | 'tetrahedron'

interface ParticleState {
  t: number
  speed: number
  mx: number
  my: number
  mz: number
  cx: number
  cy: number
  cz: number
  randomRadiusOffset: number
}

interface AntigravityInnerProps {
  count?: number
  magnetRadius?: number
  ringRadius?: number
  waveSpeed?: number
  waveAmplitude?: number
  particleSize?: number
  lerpSpeed?: number
  color?: string
  autoAnimate?: boolean
  particleVariance?: number
  rotationSpeed?: number
  depthFactor?: number
  pulseSpeed?: number
  particleShape?: ParticleShape
  fieldStrength?: number
  opacity?: number
  additive?: boolean
}

function AntigravityInner({
  count = 300,
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 2,
  lerpSpeed = 0.1,
  color = '#8f82ff',
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'capsule',
  fieldStrength = 10,
  opacity = 0.6,
  additive = true,
}: AntigravityInnerProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const { viewport } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const lastMousePos = useRef({ x: 0, y: 0 })
  const lastMouseMoveTime = useRef(0)
  const virtualMouse = useRef({ x: 0, y: 0 })

  const particles = useMemo(() => {
    const temp: ParticleState[] = []
    const width = viewport.width || 100
    const height = viewport.height || 100

    for (let i = 0; i < count; i += 1) {
      const speed = 0.01 + Math.random() / 200
      const x = (Math.random() - 0.5) * width
      const y = (Math.random() - 0.5) * height
      const z = (Math.random() - 0.5) * 20
      temp.push({
        t: Math.random() * 100,
        speed,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
      })
    }
    return temp
  }, [count, viewport.width, viewport.height])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const { viewport: v, pointer: m } = state
    const mouseDist = Math.hypot(m.x - lastMousePos.current.x, m.y - lastMousePos.current.y)

    if (mouseDist > 0.001) {
      lastMouseMoveTime.current = Date.now()
      lastMousePos.current = { x: m.x, y: m.y }
    }

    let destX = (m.x * v.width) / 2
    let destY = (m.y * v.height) / 2

    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 1500) {
      const time = state.clock.getElapsedTime()
      destX = Math.sin(time * 0.46) * (v.width / 4)
      destY = Math.cos(time * 0.88) * (v.height / 4)
    }

    virtualMouse.current.x += (destX - virtualMouse.current.x) * 0.05
    virtualMouse.current.y += (destY - virtualMouse.current.y) * 0.05

    const targetX = virtualMouse.current.x
    const targetY = virtualMouse.current.y
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed

    particles.forEach((particle, i) => {
      const t = (particle.t += particle.speed / 2)
      const projectionFactor = 1 - particle.cz / 50
      const projectedTargetX = targetX * projectionFactor
      const projectedTargetY = targetY * projectionFactor

      const dx = particle.mx - projectedTargetX
      const dy = particle.my - projectedTargetY
      const dist = Math.hypot(dx, dy)

      let targetPos = { x: particle.mx, y: particle.my, z: particle.mz * depthFactor }

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation
        const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude)
        const deviation = particle.randomRadiusOffset * (5 / (fieldStrength + 0.1))
        const currentRingRadius = ringRadius + wave + deviation

        targetPos = {
          x: projectedTargetX + currentRingRadius * Math.cos(angle),
          y: projectedTargetY + currentRingRadius * Math.sin(angle),
          z: particle.mz * depthFactor + Math.sin(t) * waveAmplitude * depthFactor,
        }
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed

      dummy.position.set(particle.cx, particle.cy, particle.cz)
      dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz)
      dummy.rotateX(Math.PI / 2)

      const currentDistToMouse = Math.hypot(particle.cx - projectedTargetX, particle.cy - projectedTargetY)
      const distFromRing = Math.abs(currentDistToMouse - ringRadius)
      const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10))
      const finalScale = scaleFactor * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) * particleSize

      dummy.scale.set(finalScale, finalScale, finalScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === 'capsule' && <capsuleGeometry args={[0.1, 0.4, 4, 8]} />}
      {particleShape === 'sphere' && <sphereGeometry args={[0.2, 16, 16]} />}
      {particleShape === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {particleShape === 'tetrahedron' && <tetrahedronGeometry args={[0.3]} />}
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </instancedMesh>
  )
}

interface AntigravityProps extends AntigravityInnerProps {
  className?: string
}

export default function Antigravity({ className = '', ...props }: AntigravityProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 50], fov: 35 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true }}>
        <AntigravityInner {...props} />
      </Canvas>
    </div>
  )
}
