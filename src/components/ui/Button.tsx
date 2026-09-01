import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent-500 text-white shadow-sm hover:bg-accent-600 hover:shadow-md',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
  ghost: 'bg-transparent text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-12 px-6 text-body',
  sm: 'h-9 px-4 text-callout',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: {
  variant?: Variant
  size?: Size
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        'transition-[transform,background-color,box-shadow] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-standard)]',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  )
}
