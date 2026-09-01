import { motion } from 'framer-motion'
import type { StatusTone } from './StatusChip'

const FILL_CLASSES: Record<StatusTone, string> = {
  onTrack: 'bg-accent-500',
  attention: 'bg-status-attention',
  overdue: 'bg-status-overdue',
  info: 'bg-status-info',
}

export function BarRow({
  label,
  value,
  total,
  tone = 'onTrack',
  valueLabel,
}: {
  label: string
  value: number
  total: number
  tone?: StatusTone
  valueLabel?: string
}) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-footnote">
        <span className="text-neutral-600">{label}</span>
        <span className="font-medium text-neutral-900 tabular-nums">{valueLabel ?? value.toLocaleString('en-IN')}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <motion.div
          className={`h-full rounded-full ${FILL_CLASSES[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.52, ease: [0.2, 0, 0, 1] }}
        />
      </div>
    </div>
  )
}
