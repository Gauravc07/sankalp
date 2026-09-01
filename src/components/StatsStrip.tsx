import { Building2, MapPinned, Users, BellRing, type LucideIcon } from 'lucide-react'
import { Container } from './ui/Container'
import { Counter } from './ui/Counter'
import { Reveal } from './ui/Reveal'

type Tile = 'blue' | 'green' | 'rose' | 'amber'

const TILE_CLASSES: Record<Tile, string> = {
  blue: 'bg-tile-blue-bg text-tile-blue-fg',
  green: 'bg-tile-green-bg text-tile-green-fg',
  rose: 'bg-tile-rose-bg text-tile-rose-fg',
  amber: 'bg-tile-amber-bg text-tile-amber-fg',
}

const STATS: { value: number; suffix: string; label: string; icon: LucideIcon; tile: Tile }[] = [
  { value: 50, suffix: '+', label: 'builder tenants at scale target', icon: Building2, tile: 'blue' },
  { value: 500, suffix: '', label: 'projects supported across cities', icon: MapPinned, tile: 'green' },
  { value: 500000, suffix: '+', label: 'buyer accounts within 18 months', icon: Users, tile: 'rose' },
  { value: 1000000, suffix: '/day', label: 'notifications across WA, email & push', icon: BellRing, tile: 'amber' },
]

export function StatsStrip() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-0 py-12">
      <Container>
        <Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-lg bg-neutral-0 p-4 shadow-sm">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TILE_CLASSES[stat.tile]}`}>
                  <stat.icon size={18} />
                </span>
                <div>
                  <p className="font-display text-title-3 font-bold text-neutral-900">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-caption leading-snug text-neutral-600">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
