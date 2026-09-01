import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { signUpTeamMember, TEAM_ROLES, type TeamRole } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import { AuthShell, AuthField, AuthError, AuthSubmit } from '../components/AuthShell'

export function SignupTeamPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleType = (TEAM_ROLES.find((r) => r.value === searchParams.get('role'))?.value ?? 'site_staff') as TeamRole
  const roleLabel = TEAM_ROLES.find((r) => r.value === roleType)?.label ?? 'Team'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState(searchParams.get('code')?.toUpperCase() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signUpError, needsEmailConfirmation } = await signUpTeamMember({
        email,
        password,
        fullName,
        inviteCode,
        roleType,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true)
        return
      }
      navigate(TEAM_ROLES.find((r) => r.value === roleType)?.path ?? '/staff')
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
          Click it, then come back and sign in — we&rsquo;ll link your invite automatically.
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
      title={`Set up your ${roleLabel} account`}
      subtitle="Use the invite code your builder shared with you"
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
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Priya Nair"
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
          label="Invite code"
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="e.g. E16999C0"
        />
        <AuthSubmit loading={loading} disabled={!isSupabaseConfigured}>Create account</AuthSubmit>
      </form>
    </AuthShell>
  )
}
