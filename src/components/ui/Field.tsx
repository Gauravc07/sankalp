import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-footnote font-medium text-neutral-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-accent-500"
      />
    </label>
  )
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-footnote font-medium text-neutral-600">{label}</span>
      <select
        {...props}
        className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none transition focus:border-accent-500"
      >
        {children}
      </select>
    </label>
  )
}

export function SmallButton({
  children,
  ...props
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full bg-accent-500 px-4 py-2 text-caption font-semibold text-white transition duration-[var(--duration-fast)] active:scale-[0.97] hover:bg-accent-600 disabled:opacity-50"
    >
      {children}
    </button>
  )
}
