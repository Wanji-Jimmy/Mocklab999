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
        <div className="warm-fluid-ribbon" />
        <div className="warm-fluid-prism" />
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
