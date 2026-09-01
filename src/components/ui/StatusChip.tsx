import clsx from 'clsx'

export type StatusTone = 'onTrack' | 'attention' | 'overdue' | 'info'

const TONE_CLASSES: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  onTrack: { bg: 'bg-status-on-track/12', text: 'text-status-on-track', dot: 'bg-status-on-track' },
  attention: { bg: 'bg-status-attention/12', text: 'text-status-attention', dot: 'bg-status-attention' },
  overdue: { bg: 'bg-status-overdue/12', text: 'text-status-overdue', dot: 'bg-status-overdue' },
  info: { bg: 'bg-status-info/12', text: 'text-status-info', dot: 'bg-status-info' },
}

export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  const c = TONE_CLASSES[tone]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium tracking-[0.02em] uppercase',
        c.bg,
        c.text,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', c.dot)} />
      {label}
    </span>
  )
}

/**
 * Maps the many domain-specific status strings used across construction,
 * compliance, sales, vendor, and contractor records onto one consistent
 * four-tone vocabulary — see uiux prompt Section 7.4.
 */
export function statusTone(value: string): StatusTone {
  const onTrack = ['on_schedule', 'completed', 'pass', 'approved', 'paid', 'active', 'signed', 'available', 'sold', 'fulfilled']
  const attention = ['pending', 'applied', 'in_progress', 'issued', 'draft', 'generated', 'sent_for_signature', 'booked', 'not_registered']
  const overdue = ['delayed', 'fail', 'rejected', 'overdue', 'lapsed', 'expired', 'cancelled', 'blocked']

  if (onTrack.includes(value)) return 'onTrack'
  if (attention.includes(value)) return 'attention'
  if (overdue.includes(value)) return 'overdue'
  return 'info'
}
