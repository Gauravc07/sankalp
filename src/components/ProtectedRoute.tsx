import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { homeFor, type Role } from '../lib/auth'

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-0 text-neutral-400">
        Loading&hellip;
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== role) {
    return <Navigate to={homeFor(profile.role)} replace />
  }

  return <>{children}</>
}
