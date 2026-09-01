import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function Card({
  children,
  className,
  hover = false,
  ...props
}: { children: ReactNode; hover?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        'rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm',
        hover && 'transition-shadow duration-[var(--duration-fast)] hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  )
}
