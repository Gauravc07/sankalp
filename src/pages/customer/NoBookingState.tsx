import { AlertTriangle } from 'lucide-react'

export function NoBookingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-status-attention/12 text-status-attention">
        <AlertTriangle size={20} />
      </span>
      <h2 className="mt-4 font-display text-title-3 font-semibold text-neutral-900">No unit linked yet</h2>
      <p className="mt-2 max-w-sm text-callout text-neutral-600">
        We couldn&rsquo;t find a booking linked to your account. If you just signed up, check your
        email to confirm your address first — your booking links automatically on your next sign in.
      </p>
    </div>
  )
}
