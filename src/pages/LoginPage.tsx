import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { signIn, homeFor } from '../lib/auth'
import { AuthShell, AuthField, AuthError, AuthSubmit } from '../components/AuthShell'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
        return
      }

      const { data: profileData } = await supabase!
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      navigate(homeFor(profileData?.role ?? 'customer'))
    } catch {
      setError('Something went wrong signing you in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your buyer or builder account"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-accent-600 hover:text-accent-500">
            Create an account
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <AuthSubmit loading={loading} disabled={!isSupabaseConfigured}>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  )
}
