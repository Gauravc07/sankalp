import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

    const { data, error: signInError } = await signIn(email, password)
    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    const { data: profileData } = await supabase!
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)
    navigate(homeFor(profileData?.role ?? 'customer'))
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
        <AuthSubmit loading={loading}>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  )
}
