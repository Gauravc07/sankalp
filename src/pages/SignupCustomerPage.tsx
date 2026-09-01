import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { signUpCustomer } from '../lib/auth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthShell, AuthField, AuthError, AuthSubmit } from '../components/AuthShell'

type ActivationInfo = {
  full_name: string | null
  email: string | null
  unit_number: string | null
  tower_name: string | null
  project_name: string | null
  already_claimed: boolean
}

export function SignupCustomerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activationCode = searchParams.get('code')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bookingCode, setBookingCode] = useState(activationCode ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [activation, setActivation] = useState<ActivationInfo | null>(null)
  const [activationLoading, setActivationLoading] = useState(!!activationCode)

  useEffect(() => {
    if (!activationCode || !supabase) return
    supabase
      .rpc('booking_activation_info', { p_code: activationCode })
      .then(
        ({ data }) => {
          const info = (data as ActivationInfo[] | null)?.[0] ?? null
          setActivation(info)
          if (info) {
            if (info.full_name) setFullName(info.full_name)
            if (info.email) setEmail(info.email)
          }
          setActivationLoading(false)
        },
        () => setActivationLoading(false),
      )
  }, [activationCode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signUpError, needsEmailConfirmation } = await signUpCustomer({
        email,
        password,
        fullName,
        bookingCode,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true)
        return
      }
      navigate('/customer')
    } catch {
      setError('Something went wrong creating your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <AuthShell title="Check your email" subtitle="One more step before you're in">
        <p className="text-callout leading-relaxed text-neutral-600">
          We&rsquo;ve sent a confirmation link to <span className="font-medium text-neutral-900">{email}</span>.
          Click it, then come back and sign in — we&rsquo;ll link your booking automatically.
        </p>
        <Link
          to="/login"
          className="mt-6 block w-full rounded-full bg-accent-500 px-5 py-3 text-center text-callout font-semibold text-white transition hover:bg-accent-600"
        >
          Go to sign in
        </Link>
      </AuthShell>
    )
  }

  if (activationCode && activationLoading) {
    return (
      <AuthShell title="Activating your account…" subtitle="One moment">
        <p className="text-callout text-neutral-400">Loading your booking details&hellip;</p>
      </AuthShell>
    )
  }

  if (activationCode && activation?.already_claimed) {
    return (
      <AuthShell title="Account already activated" subtitle="This booking is already linked to an account">
        <p className="text-callout leading-relaxed text-neutral-600">
          This activation link has already been used. If this is your unit, sign in with the account you created
          earlier.
        </p>
        <Link
          to="/login"
          className="mt-6 block w-full rounded-full bg-accent-500 px-5 py-3 text-center text-callout font-semibold text-white transition hover:bg-accent-600"
        >
          Go to sign in
        </Link>
      </AuthShell>
    )
  }

  const isActivation = !!activationCode && !!activation && !activation.already_claimed

  return (
    <AuthShell
      title={isActivation ? 'Activate your account' : 'Set up your buyer account'}
      subtitle={
        isActivation
          ? `${activation!.tower_name ?? ''} · ${activation!.unit_number ?? ''}, ${activation!.project_name ?? ''} — just set a password to finish`
          : 'Use the booking code your builder shared with you'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isSupabaseConfigured && (
          <AuthError>This app isn&rsquo;t connected to its database yet — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing from this deployment&rsquo;s environment variables.</AuthError>
        )}
        {error && <AuthError>{error}</AuthError>}
        <AuthField
          label="Full name"
          required
          readOnly={isActivation && !!activation!.full_name}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Asha Rao"
        />
        <AuthField
          label="Email"
          type="email"
          required
          readOnly={isActivation && !!activation!.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {!isActivation && (
          <AuthField
            label="Booking code"
            required
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
            placeholder="e.g. SLAB-4F82"
          />
        )}
        <AuthSubmit loading={loading} disabled={!isSupabaseConfigured}>{isActivation ? 'Activate account' : 'Create account'}</AuthSubmit>
      </form>
    </AuthShell>
  )
}
