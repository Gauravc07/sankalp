import { motion } from 'framer-motion'
import type { StatusTone } from './StatusChip'

const FILL_CLASSES: Record<StatusTone, string> = {
  onTrack: 'bg-accent-500',
  attention: 'bg-status-attention',
  overdue: 'bg-status-overdue',
  info: 'bg-status-info',
}

export function ProgressBar({
  percent,
  tone = 'onTrack',
  showLabel = true,
}: {
  percent: number
  tone?: StatusTone
  showLabel?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <motion.div
          className={`h-full rounded-full ${FILL_CLASSES[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.52, ease: [0.2, 0, 0, 1] }}
        />
      </div>
      {showLabel && <span className="text-footnote text-neutral-600 tabular-nums">{clamped}%</span>}
    </div>
  )
}
