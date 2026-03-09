import Antigravity from '@/components/Antigravity'
import ParticleField from '@/components/ParticleField'

interface AnimatedBackdropProps {
  intensity?: 'soft' | 'strong'
  tone?: 'cool' | 'warm'
}

export default function AnimatedBackdrop({ intensity = 'soft', tone = 'cool' }: AnimatedBackdropProps) {
  const particleCount = intensity === 'strong' ? 120 : 90
  const opacity = intensity === 'strong' ? 'opacity-95' : 'opacity-80'
  const isWarm = tone === 'warm'

  if (isWarm) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="warm-antigravity-base" />
        <div className="warm-antigravity-haze" />
        <Antigravity
          className="warm-antigravity-layer absolute inset-0 h-full w-full"
          count={180}
          magnetRadius={10.5}
          ringRadius={9.8}
          waveSpeed={0.38}
          waveAmplitude={0.9}
          particleSize={1.8}
          lerpSpeed={0.085}
          color="#8b82ff"
          autoAnimate
          particleVariance={0.95}
          rotationSpeed={0.09}
          depthFactor={1}
          pulseSpeed={2.5}
          particleShape="capsule"
          fieldStrength={9.5}
          opacity={0.38}
        />
        <Antigravity
          className="warm-antigravity-layer warm-antigravity-layer-soft absolute inset-0 h-full w-full"
          count={140}
          magnetRadius={12.2}
          ringRadius={11.2}
          waveSpeed={0.33}
          waveAmplitude={0.78}
          particleSize={1.55}
          lerpSpeed={0.078}
          color="#67b8ff"
          autoAnimate
          particleVariance={0.9}
          rotationSpeed={-0.07}
          depthFactor={0.92}
          pulseSpeed={2.1}
          particleShape="sphere"
          fieldStrength={10.2}
          opacity={0.3}
        />
        <Antigravity
          className="warm-antigravity-layer warm-antigravity-layer-accent absolute inset-0 h-full w-full"
          count={110}
          magnetRadius={11.6}
          ringRadius={10.6}
          waveSpeed={0.31}
          waveAmplitude={0.68}
          particleSize={1.45}
          lerpSpeed={0.075}
          color="#ffc17f"
          autoAnimate
          particleVariance={0.82}
          rotationSpeed={0.06}
          depthFactor={0.9}
          pulseSpeed={1.9}
          particleShape="tetrahedron"
          fieldStrength={10}
          opacity={0.14}
        />
        <div className="warm-noise-film" />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="premium-grid" />
      <div className="premium-energy-band" />
      <div className="premium-energy-halo" />
      <div className="premium-glow premium-glow-a" />
      <div className="premium-glow premium-glow-b" />
      <div className="premium-glow premium-glow-c" />
      <ParticleField className={`absolute inset-0 h-full w-full ${opacity}`} particleCount={particleCount} tone={tone} />
    </div>
  )
}
