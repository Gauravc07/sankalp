import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpCustomer } from '../lib/auth'
import { AuthShell, AuthField, AuthError, AuthSubmit } from '../components/AuthShell'

export function SignupCustomerPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bookingCode, setBookingCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signUpError, needsEmailConfirmation } = await signUpCustomer({
      email,
      password,
      fullName,
      bookingCode,
    })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (needsEmailConfirmation) {
      setNeedsConfirmation(true)
      return
    }
    navigate('/customer')
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

  return (
    <AuthShell
      title="Set up your buyer account"
      subtitle="Use the booking code your builder shared with you"
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
        {error && <AuthError>{error}</AuthError>}
        <AuthField
          label="Full name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Asha Rao"
        />
        <AuthField
          label="Email"
          type="email"
          required
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
        <AuthField
          label="Booking code"
          required
          value={bookingCode}
          onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
          placeholder="e.g. SLAB-4F82"
        />
        <AuthSubmit loading={loading}>Create account</AuthSubmit>
      </form>
    </AuthShell>
  )
}
