import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-caption font-medium tracking-[0.02em] text-neutral-600 uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge className="mb-5">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
      {children}
    </Badge>
  )
}
