import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Blocks } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-0 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_35%,transparent_100%)]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2.5 font-display text-lg font-bold text-neutral-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-500 text-white">
            <Blocks size={18} strokeWidth={2.5} />
          </span>
          Sankalp
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-0 p-8 shadow-lg">
          <h1 className="font-display text-title-2 font-bold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-2 text-callout text-neutral-600">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-callout text-neutral-600">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-footnote font-medium text-neutral-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-4 py-3 text-callout text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-accent-500"
      />
    </label>
  )
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-status-overdue/25 bg-accent-100 px-3.5 py-2.5 text-callout text-accent-600">
      {children}
    </div>
  )
}

export function AuthSubmit({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-accent-500 px-5 py-3 text-callout font-semibold text-white transition duration-[var(--duration-fast)] active:scale-[0.97] hover:bg-accent-600 disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}
