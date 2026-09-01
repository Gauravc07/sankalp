import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpBuilder } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import { AuthShell, AuthField, AuthError, AuthSubmit } from '../components/AuthShell'

export function SignupBuilderPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signUpError, needsEmailConfirmation } = await signUpBuilder({
        email,
        password,
        fullName,
        companyName,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true)
        return
      }
      navigate('/builder')
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
          Click it, then come back and sign in to set up your first project.
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
      title="Onboard your project"
      subtitle="Set up your builder account on Sankalp"
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
          label="Your name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Rohan Mehta"
        />
        <AuthField
          label="Company name"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Skyline Developers Pvt. Ltd."
        />
        <AuthField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
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
        <AuthSubmit loading={loading} disabled={!isSupabaseConfigured}>Create builder account</AuthSubmit>
      </form>
    </AuthShell>
  )
}
