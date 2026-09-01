import type { LucideIcon } from 'lucide-react'
import { Counter } from './Counter'

type Tile = 'blue' | 'green' | 'rose' | 'amber'

const TILE_CLASSES: Record<Tile, string> = {
  blue: 'bg-tile-blue-bg text-tile-blue-fg',
  green: 'bg-tile-green-bg text-tile-green-fg',
  rose: 'bg-tile-rose-bg text-tile-rose-fg',
  amber: 'bg-tile-amber-bg text-tile-amber-fg',
}

export function StatTile({
  icon: Icon,
  tile,
  value,
  prefix = '',
  suffix = '',
  label,
}: {
  icon: LucideIcon
  tile: Tile
  value: number
  prefix?: string
  suffix?: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TILE_CLASSES[tile]}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-title-3 font-bold text-neutral-900">
          <Counter to={value} prefix={prefix} suffix={suffix} />
        </p>
        <p className="text-caption leading-snug text-neutral-600">{label}</p>
      </div>
    </div>
  )
}
