import { Link } from 'react-router-dom'
import { Home, Building2 } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'

export function SignupChoicePage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Are you a buyer or a builder?"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-500">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <Link
          to="/signup/customer"
          className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4 transition hover:border-tile-amber-fg/40 hover:bg-tile-amber-bg/40"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tile-amber-bg text-tile-amber-fg">
            <Home size={20} />
          </span>
          <span>
            <span className="block text-callout font-semibold text-neutral-900">I&rsquo;m a buyer</span>
            <span className="block text-footnote text-neutral-600">
              I&rsquo;ve booked a unit and have a booking code
            </span>
          </span>
        </Link>

        <Link
          to="/signup/builder"
          className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4 transition hover:border-tile-blue-fg/40 hover:bg-tile-blue-bg/40"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tile-blue-bg text-tile-blue-fg">
            <Building2 size={20} />
          </span>
          <span>
            <span className="block text-callout font-semibold text-neutral-900">I&rsquo;m a builder</span>
            <span className="block text-footnote text-neutral-600">
              I want to onboard my project onto Sankalp
            </span>
          </span>
        </Link>
      </div>
    </AuthShell>
  )
}
